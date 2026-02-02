import { Router, Request, Response } from 'express';
import { getDriver } from '../drivers';
import { ExecuteRequest, ConnectionConfig } from '../types';

const router = Router();

// 연결 테스트
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const config: ConnectionConfig = req.body;
    
    if (!config.type || !config.host || !config.port || !config.database || !config.username) {
      return res.status(400).json({
        success: false,
        message: '필수 연결 정보가 누락되었습니다.',
      });
    }

    const driver = getDriver(config.type);
    const result = await driver.testConnection(config);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '연결 테스트 중 오류가 발생했습니다.',
    });
  }
});

// SQL 실행
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { sql, ...config }: ExecuteRequest = req.body;
    
    if (!sql || !sql.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ERR-001',
          message: 'SQL 쿼리가 비어 있습니다.',
        },
      });
    }

    if (!config.type || !config.host) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ERR-002',
          message: '연결 정보가 누락되었습니다.',
        },
      });
    }

    const driver = getDriver(config.type);
    const result = await driver.executeQuery(config, sql);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ERR-500',
        message: error.message || '쿼리 실행 중 오류가 발생했습니다.',
      },
    });
  }
});

// 서버 상태 확인
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supportedDBMS: ['oracle', 'mysql', 'postgresql', 'mariadb', 'sqlserver'],
  });
});

export default router;
