import express from 'express';
import cors from 'cors';
import sqlRoutes from './routes/sql';

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors({
  origin: '*', // 개발 환경에서는 모든 출처 허용
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// 요청 로깅
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 라우트
app.use('/api', sqlRoutes);

// 루트 경로
app.get('/', (req, res) => {
  res.json({
    name: 'SQL Proxy Server',
    version: '1.0.0',
    description: 'Proxy server for browser-based database connections',
    endpoints: {
      health: 'GET /api/health',
      connect: 'POST /api/connect',
      execute: 'POST /api/execute',
    },
  });
});

// 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'ERR-500',
      message: err.message || 'Internal server error',
    },
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                   SQL Proxy Server                         ║
╠════════════════════════════════════════════════════════════╣
║  Status: Running                                           ║
║  Port: ${PORT}                                                 ║
║  URL: http://localhost:${PORT}                                 ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    GET  /api/health   - Server status                      ║
║    POST /api/connect  - Test database connection           ║
║    POST /api/execute  - Execute SQL query                  ║
╠════════════════════════════════════════════════════════════╣
║  Supported DBMS:                                           ║
║    - Oracle (oracledb)                                     ║
║    - MySQL (mysql2)                                        ║
║    - PostgreSQL (pg)                                       ║
║    - MariaDB (mysql2)                                      ║
║    - SQL Server (mssql)                                    ║
╚════════════════════════════════════════════════════════════╝
  `);
});
