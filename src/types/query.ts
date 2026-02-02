export interface QueryResult {
  success: boolean;
  data?: {
    columns: string[];
    rows: (string | number | null)[][];
    rowCount: number;
    executionTime: number;
  };
  affectedRows?: number;
  executionTime?: number;
  error?: QueryError;
}

export interface QueryError {
  code: string;
  message: string;
  line?: number;
  position?: number;
}

export interface QueryHistoryItem {
  id: string;
  sql: string;
  dbms: string;
  timestamp: Date;
  success: boolean;
  executionTime?: number;
  rowCount?: number;
  error?: string;
}

export type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL' | 'OTHER';

export function detectQueryType(sql: string): QueryType {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) return 'SELECT';
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  if (trimmed.startsWith('CREATE') || trimmed.startsWith('ALTER') || trimmed.startsWith('DROP')) return 'DDL';
  return 'OTHER';
}
