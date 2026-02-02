import sql from 'mssql';
import { ConnectionConfig, QueryResult, ConnectionTestResult, DBDriver } from '../types';

function detectQueryType(sqlStr: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL' | 'OTHER' {
  const trimmed = sqlStr.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) return 'SELECT';
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  if (trimmed.startsWith('CREATE') || trimmed.startsWith('ALTER') || trimmed.startsWith('DROP')) return 'DDL';
  return 'OTHER';
}

export const sqlserverDriver: DBDriver = {
  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const pool = await sql.connect({
        server: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        options: {
          encrypt: false, // 로컬 환경에서는 암호화 비활성화
          trustServerCertificate: true,
        },
      });

      const result = await pool.request().query('SELECT @@VERSION as version');
      const version = result.recordset[0]?.version || 'SQL Server';

      await pool.close();

      return {
        success: true,
        message: '성공적으로 연결되었습니다',
        version: version.split('\n')[0], // 첫 줄만 추출
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '연결에 실패했습니다',
      };
    }
  },

  async executeQuery(config: ConnectionConfig, sqlQuery: string): Promise<QueryResult> {
    const startTime = performance.now();

    try {
      const pool = await sql.connect({
        server: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      });

      const queryType = detectQueryType(sqlQuery);
      const result = await pool.request().query(sqlQuery);

      await pool.close();

      if (queryType === 'SELECT') {
        const columns = result.recordset.columns
          ? Object.keys(result.recordset.columns).map((c) => c.toUpperCase())
          : result.recordset.length > 0
          ? Object.keys(result.recordset[0]).map((c) => c.toUpperCase())
          : [];

        const rows = result.recordset.map((row) =>
          columns.map((col) => row[col] ?? row[col.toLowerCase()])
        );

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
        return {
          success: true,
          affectedRows: result.rowsAffected?.[0] || 0,
          executionTime: (performance.now() - startTime) / 1000,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'ERR-001',
          message: error.message || '알 수 없는 오류가 발생했습니다',
          line: error.lineNumber,
        },
        executionTime: (performance.now() - startTime) / 1000,
      };
    }
  },
};
