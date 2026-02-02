import { Client } from 'pg';
import { ConnectionConfig, QueryResult, ConnectionTestResult, DBDriver } from '../types';

function detectQueryType(sql: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL' | 'OTHER' {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) return 'SELECT';
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  if (trimmed.startsWith('CREATE') || trimmed.startsWith('ALTER') || trimmed.startsWith('DROP')) return 'DDL';
  return 'OTHER';
}

export const postgresqlDriver: DBDriver = {
  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
    });

    try {
      await client.connect();
      const result = await client.query('SELECT version()');
      const version = result.rows[0]?.version || 'PostgreSQL';

      return {
        success: true,
        message: '성공적으로 연결되었습니다',
        version: version.split(',')[0], // "PostgreSQL 15.4" 형식으로 추출
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '연결에 실패했습니다',
      };
    } finally {
      await client.end();
    }
  },

  async executeQuery(config: ConnectionConfig, sql: string): Promise<QueryResult> {
    const startTime = performance.now();
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
    });

    try {
      await client.connect();
      const queryType = detectQueryType(sql);

      const result = await client.query(sql);

      if (queryType === 'SELECT') {
        const columns = result.fields.map((f) => f.name.toUpperCase());
        const rows = result.rows.map((row) =>
          result.fields.map((f) => row[f.name])
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
          affectedRows: result.rowCount || 0,
          executionTime: (performance.now() - startTime) / 1000,
        };
      }
    } catch (error: any) {
      // PostgreSQL 에러 파싱
      const position = error.position ? parseInt(error.position) : undefined;
      
      return {
        success: false,
        error: {
          code: error.code || 'ERR-001',
          message: error.message || '알 수 없는 오류가 발생했습니다',
          position,
        },
        executionTime: (performance.now() - startTime) / 1000,
      };
    } finally {
      await client.end();
    }
  },
};
