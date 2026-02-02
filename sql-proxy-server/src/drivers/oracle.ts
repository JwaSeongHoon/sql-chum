import oracledb from 'oracledb';
import { ConnectionConfig, QueryResult, ConnectionTestResult, DBDriver } from '../types';

// Oracle Instant Client 초기화 (필요시)
// oracledb.initOracleClient({ libDir: '/path/to/instantclient' });

function detectQueryType(sql: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL' | 'OTHER' {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) return 'SELECT';
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  if (trimmed.startsWith('CREATE') || trimmed.startsWith('ALTER') || trimmed.startsWith('DROP')) return 'DDL';
  return 'OTHER';
}

export const oracleDriver: DBDriver = {
  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: config.username,
        password: config.password,
        connectString: `${config.host}:${config.port}/${config.database}`,
      });

      // 버전 정보 조회
      const result = await connection.execute<{ BANNER: string }>(
        'SELECT BANNER FROM V$VERSION WHERE ROWNUM = 1'
      );

      const version = result.rows?.[0]?.BANNER || 'Oracle Database';

      return {
        success: true,
        message: '성공적으로 연결되었습니다',
        version,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '연결에 실패했습니다',
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          console.error('Error closing connection:', e);
        }
      }
    }
  },

  async executeQuery(config: ConnectionConfig, sql: string): Promise<QueryResult> {
    const startTime = performance.now();
    let connection;

    try {
      connection = await oracledb.getConnection({
        user: config.username,
        password: config.password,
        connectString: `${config.host}:${config.port}/${config.database}`,
      });

      const queryType = detectQueryType(sql);

      if (queryType === 'SELECT') {
        // SELECT 쿼리
        const result = await connection.execute(sql, [], {
          outFormat: oracledb.OUT_FORMAT_ARRAY,
          fetchArraySize: 1000,
        });

        const columns = result.metaData?.map((meta) => meta.name) || [];
        const rows = (result.rows as any[][]) || [];

        return {
          success: true,
          data: {
            columns,
            rows,
            rowCount: rows.length,
            executionTime: (performance.now() - startTime) / 1000,
          },
        };
      } else {
        // DML/DDL 쿼리
        const result = await connection.execute(sql, [], {
          autoCommit: true,
        });

        return {
          success: true,
          affectedRows: result.rowsAffected || 0,
          executionTime: (performance.now() - startTime) / 1000,
        };
      }
    } catch (error: any) {
      // Oracle 에러 파싱
      const oraMatch = error.message?.match(/ORA-(\d+)/);
      const errorCode = oraMatch ? `ORA-${oraMatch[1]}` : 'ERR-001';
      
      // 위치 정보 추출 시도
      const lineMatch = error.message?.match(/line (\d+)/i);
      const posMatch = error.message?.match(/column (\d+)|position (\d+)/i);

      return {
        success: false,
        error: {
          code: errorCode,
          message: error.message || '알 수 없는 오류가 발생했습니다',
          line: lineMatch ? parseInt(lineMatch[1]) : undefined,
          position: posMatch ? parseInt(posMatch[1] || posMatch[2]) : undefined,
        },
        executionTime: (performance.now() - startTime) / 1000,
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          console.error('Error closing connection:', e);
        }
      }
    }
  },
};
