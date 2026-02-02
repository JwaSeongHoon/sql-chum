import mysql from 'mysql2/promise';
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

export const mysqlDriver: DBDriver = {
  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    let connection;
    try {
      connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
      });

      const [rows] = await connection.execute<any[]>('SELECT VERSION() as version');
      const version = rows[0]?.version || 'MySQL';

      return {
        success: true,
        message: '성공적으로 연결되었습니다',
        version: `MySQL ${version}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '연결에 실패했습니다',
      };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  },

  async executeQuery(config: ConnectionConfig, sql: string): Promise<QueryResult> {
    const startTime = performance.now();
    let connection;

    try {
      connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
      });

      const queryType = detectQueryType(sql);

      if (queryType === 'SELECT') {
        const [rows, fields] = await connection.execute(sql);
        const columns = fields?.map((f: any) => f.name) || [];
        const rowsArray = (rows as any[]).map((row) =>
          columns.map((col) => row[col])
        );

        return {
          success: true,
          data: {
            columns,
            rows: rowsArray,
            rowCount: rowsArray.length,
            executionTime: (performance.now() - startTime) / 1000,
          },
        };
      } else {
        const [result] = await connection.execute(sql);
        
        return {
          success: true,
          affectedRows: (result as any).affectedRows || 0,
          executionTime: (performance.now() - startTime) / 1000,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'ERR-001',
          message: error.message || '알 수 없는 오류가 발생했습니다',
        },
        executionTime: (performance.now() - startTime) / 1000,
      };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  },
};
