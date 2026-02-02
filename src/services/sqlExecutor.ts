import { QueryResult, QueryError, detectQueryType } from '@/types/query';
import { DBMSType } from '@/types/database';
import { getMockData, parseMockQuery } from './mockData';

// Simulated delay to mimic real database response
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

export async function executeQuery(sql: string, dbms: DBMSType): Promise<QueryResult> {
  const startTime = performance.now();
  
  await simulateDelay();
  
  const queryType = detectQueryType(sql);
  const trimmedSql = sql.trim();
  
  // Check for common errors
  const error = validateQuery(trimmedSql);
  if (error) {
    return {
      success: false,
      error,
      executionTime: (performance.now() - startTime) / 1000,
    };
  }
  
  try {
    if (queryType === 'SELECT') {
      return executeSelectQuery(trimmedSql, startTime);
    } else if (queryType === 'INSERT' || queryType === 'UPDATE' || queryType === 'DELETE') {
      return executeDMLQuery(queryType, startTime);
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
        message: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다',
      },
      executionTime: (performance.now() - startTime) / 1000,
    };
  }
}

function validateQuery(sql: string): QueryError | null {
  const upperSql = sql.toUpperCase();
  
  // Check for known invalid tables
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
        message: '테이블 또는 뷰가 존재하지 않습니다',
        line: lineNumber,
        position: columnPosition + 1,
      };
    }
  }
  
  // Check for syntax errors (very basic)
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

function executeSelectQuery(sql: string, startTime: number): QueryResult {
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
        message: '테이블 또는 뷰가 존재하지 않습니다',
        line: 1,
        position: sql.toLowerCase().indexOf(parsed.table) + 1,
      },
    };
  }
  
  // Apply WHERE filter
  if (Object.keys(parsed.where).length > 0) {
    data = data.filter(row => {
      return Object.entries(parsed.where).every(([key, value]) => {
        return row[key] === value;
      });
    });
  }
  
  // Apply ORDER BY
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
  
  // Get columns
  const allColumns = data.length > 0 ? Object.keys(data[0]) : [];
  const selectedColumns = parsed.columns === '*' 
    ? allColumns 
    : parsed.columns.filter(c => allColumns.includes(c));
  
  const columns = selectedColumns.length > 0 ? selectedColumns : allColumns;
  
  // Build rows
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

function executeDMLQuery(type: string, startTime: number): QueryResult {
  // Simulate affected rows
  const affectedRows = Math.floor(Math.random() * 10) + 1;
  
  return {
    success: true,
    affectedRows,
    executionTime: (performance.now() - startTime) / 1000,
  };
}

export async function testConnection(dbms: DBMSType): Promise<{ success: boolean; message: string; version?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  const versions: Record<DBMSType, string> = {
    oracle: 'Oracle Database 11g Express Edition Release 11.2.0.2.0',
    mysql: 'MySQL 8.0.35',
    postgresql: 'PostgreSQL 15.4',
    mariadb: 'MariaDB 10.11.6',
    sqlserver: 'Microsoft SQL Server 2022',
  };
  
  // 90% success rate for demo
  if (Math.random() > 0.1) {
    return {
      success: true,
      message: '성공적으로 연결되었습니다',
      version: versions[dbms],
    };
  }
  
  return {
    success: false,
    message: '연결에 실패했습니다. 호스트를 확인해주세요.',
  };
}
