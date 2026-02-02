import { QueryResult, QueryError, detectQueryType } from '@/types/query';
import { DBMSConfig } from '@/types/database';
import { getMockData, parseMockQuery } from './mockData';

// 프록시 서버 URL (로컬 환경)
const DEFAULT_PROXY_URL = 'http://localhost:3001';

// 프록시 URL을 가져오는 함수 (스토어에서 관리)
export function getProxyUrl(): string {
  try {
    const stored = localStorage.getItem('sql-editor-storage');
    if (stored) {
      const data = JSON.parse(stored);
      return data.state?.proxyUrl || DEFAULT_PROXY_URL;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PROXY_URL;
}

// 프록시 서버 상태 확인
export async function checkProxyHealth(): Promise<{ 
  connected: boolean; 
  message: string;
  supportedDBMS?: string[];
}> {
  try {
    const response = await fetch(`${getProxyUrl()}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3초 타임아웃
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        connected: true,
        message: '프록시 서버가 실행 중입니다',
        supportedDBMS: data.supportedDBMS,
      };
    }
    
    return {
      connected: false,
      message: '프록시 서버 응답 오류',
    };
  } catch (error: any) {
    return {
      connected: false,
      message: error.name === 'TimeoutError' 
        ? '프록시 서버 연결 시간 초과'
        : '프록시 서버에 연결할 수 없습니다',
    };
  }
}

// 실제 데이터베이스 연결 테스트
export async function testConnection(connection: DBMSConfig): Promise<{ 
  success: boolean; 
  message: string; 
  version?: string;
}> {
  try {
    const response = await fetch(`${getProxyUrl()}/api/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
      }),
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    // 프록시 서버 연결 실패 시 목업 모드로 폴백
    if (error.name === 'TypeError' || error.name === 'TimeoutError') {
      console.warn('프록시 서버에 연결할 수 없습니다. 목업 모드로 전환합니다.');
      return testConnectionMock(connection.type);
    }
    
    return {
      success: false,
      message: error.message || '연결 테스트 중 오류가 발생했습니다',
    };
  }
}

// 목업 연결 테스트 (프록시 없이)
function testConnectionMock(dbmsType: string): { success: boolean; message: string; version?: string } {
  const versions: Record<string, string> = {
    oracle: 'Oracle Database 11g XE (Mock Mode)',
    mysql: 'MySQL 8.0 (Mock Mode)',
    postgresql: 'PostgreSQL 15.4 (Mock Mode)',
    mariadb: 'MariaDB 10.11 (Mock Mode)',
    sqlserver: 'SQL Server 2022 (Mock Mode)',
  };
  
  return {
    success: true,
    message: '목업 모드로 연결되었습니다 (프록시 서버 필요)',
    version: versions[dbmsType] || 'Unknown (Mock Mode)',
  };
}

// SQL 실행
export async function executeQuery(sql: string, connection: DBMSConfig): Promise<QueryResult> {
  const startTime = performance.now();
  
  try {
    const response = await fetch(`${getProxyUrl()}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        sql: sql,
      }),
      signal: AbortSignal.timeout(30000), // 30초 타임아웃
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    // 프록시 서버 연결 실패 시 목업 모드로 폴백
    if (error.name === 'TypeError' || error.name === 'TimeoutError') {
      console.warn('프록시 서버에 연결할 수 없습니다. 목업 모드로 실행합니다.');
      return executeQueryMock(sql, startTime);
    }
    
    return {
      success: false,
      error: {
        code: 'ERR-NETWORK',
        message: error.message || '쿼리 실행 중 네트워크 오류가 발생했습니다',
      },
      executionTime: (performance.now() - startTime) / 1000,
    };
  }
}

// 목업 쿼리 실행 (프록시 없이)
async function executeQueryMock(sql: string, startTime: number): Promise<QueryResult> {
  // 기존 목업 로직 유지
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  const queryType = detectQueryType(sql);
  const trimmedSql = sql.trim();
  
  // Check for common errors
  const error = validateQueryMock(trimmedSql);
  if (error) {
    return {
      success: false,
      error,
      executionTime: (performance.now() - startTime) / 1000,
    };
  }
  
  try {
    if (queryType === 'SELECT') {
      return executeSelectQueryMock(trimmedSql, startTime);
    } else if (queryType === 'INSERT' || queryType === 'UPDATE' || queryType === 'DELETE') {
      return executeDMLQueryMock(queryType, startTime);
    } else {
      return {
        success: true,
        executionTime: (performance.now() - startTime) / 1000,
        affectedRows: 0,
      };
    }
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'ERR-001',
        message: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다 (Mock Mode)',
      },
      executionTime: (performance.now() - startTime) / 1000,
    };
  }
}

function validateQueryMock(sql: string): QueryError | null {
  const upperSql = sql.toUpperCase();
  
  const fromMatch = sql.match(/FROM\s+(\w+)/i);
  if (fromMatch) {
    const tableName = fromMatch[1].toLowerCase();
    const validTables = ['emp', 'employee', 'employees', 'dept', 'department', 'departments', 'salgrade'];
    
    if (!validTables.includes(tableName)) {
      const position = sql.toLowerCase().indexOf(tableName);
      const lineNumber = sql.substring(0, position).split('\n').length;
      const lineStart = sql.lastIndexOf('\n', position) + 1;
      const columnPosition = position - lineStart;
      
      return {
        code: 'ORA-00942',
        message: '테이블 또는 뷰가 존재하지 않습니다 (Mock Mode)',
        line: lineNumber,
        position: columnPosition + 1,
      };
    }
  }
  
  if (upperSql.startsWith('SELECT') && !upperSql.includes('FROM')) {
    return {
      code: 'ORA-00923',
      message: 'FROM 키워드가 필요합니다',
      line: 1,
      position: sql.length,
    };
  }
  
  return null;
}

function executeSelectQueryMock(sql: string, startTime: number): QueryResult {
  const parsed = parseMockQuery(sql);
  
  if (!parsed.table) {
    return {
      success: false,
      error: {
        code: 'ERR-002',
        message: '테이블을 찾을 수 없습니다',
      },
    };
  }
  
  let data = getMockData(parsed.table);
  
  if (data.length === 0) {
    return {
      success: false,
      error: {
        code: 'ORA-00942',
        message: '테이블 또는 뷰가 존재하지 않습니다 (Mock Mode)',
        line: 1,
        position: sql.toLowerCase().indexOf(parsed.table) + 1,
      },
    };
  }
  
  if (Object.keys(parsed.where).length > 0) {
    data = data.filter(row => {
      return Object.entries(parsed.where).every(([key, value]) => {
        return row[key] === value;
      });
    });
  }
  
  if (parsed.orderBy) {
    const { column, direction } = parsed.orderBy;
    data = [...data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal === bVal) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      const comparison = aVal < bVal ? -1 : 1;
      return direction === 'ASC' ? comparison : -comparison;
    });
  }
  
  const allColumns = data.length > 0 ? Object.keys(data[0]) : [];
  const selectedColumns = parsed.columns === '*' 
    ? allColumns 
    : parsed.columns.filter(c => allColumns.includes(c));
  
  const columns = selectedColumns.length > 0 ? selectedColumns : allColumns;
  
  const rows = data.map(row => 
    columns.map(col => row[col] ?? null)
  );
  
  return {
    success: true,
    data: {
      columns: columns.map(c => c.toUpperCase()),
      rows,
      rowCount: rows.length,
      executionTime: (performance.now() - startTime) / 1000,
    },
  };
}

function executeDMLQueryMock(type: string, startTime: number): QueryResult {
  const affectedRows = Math.floor(Math.random() * 10) + 1;
  
  return {
    success: true,
    affectedRows,
    executionTime: (performance.now() - startTime) / 1000,
  };
}
