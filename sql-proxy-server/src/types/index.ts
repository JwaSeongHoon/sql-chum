export type DBMSType = 'oracle' | 'mysql' | 'postgresql' | 'mariadb' | 'sqlserver';

export interface ConnectionConfig {
  type: DBMSType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface ExecuteRequest extends ConnectionConfig {
  sql: string;
}

export interface QueryResult {
  success: boolean;
  data?: {
    columns: string[];
    rows: any[][];
    rowCount: number;
    executionTime: number;
  };
  affectedRows?: number;
  executionTime?: number;
  error?: {
    code: string;
    message: string;
    line?: number;
    position?: number;
  };
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  version?: string;
}

export interface DBDriver {
  testConnection(config: ConnectionConfig): Promise<ConnectionTestResult>;
  executeQuery(config: ConnectionConfig, sql: string): Promise<QueryResult>;
}
