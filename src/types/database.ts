export type DBMSType = 'oracle' | 'mysql' | 'postgresql' | 'mariadb' | 'sqlserver';

export interface DBMSConfig {
  id: DBMSType;
  name: string;
  displayName: string;
  host: string;
  port: number;
  database: string;
  icon: string;
  color: string;
}

export interface ConnectionInfo {
  dbms: DBMSType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  dbms: DBMSType | null;
  message?: string;
  serverVersion?: string;
}

export const DBMS_CONFIGS: DBMSConfig[] = [
  {
    id: 'oracle',
    name: 'Oracle',
    displayName: 'Oracle 11g XE',
    host: 'localhost',
    port: 1521,
    database: 'XE',
    icon: '🔶',
    color: 'oracle',
  },
  {
    id: 'mysql',
    name: 'MySQL',
    displayName: 'MySQL 8.0',
    host: 'localhost',
    port: 3306,
    database: 'testdb',
    icon: '🐬',
    color: 'mysql',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    displayName: 'PostgreSQL 15',
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    icon: '🐘',
    color: 'postgresql',
  },
  {
    id: 'mariadb',
    name: 'MariaDB',
    displayName: 'MariaDB 10.11',
    host: 'localhost',
    port: 3307,
    database: 'testdb',
    icon: '🦭',
    color: 'mariadb',
  },
  {
    id: 'sqlserver',
    name: 'SQL Server',
    displayName: 'SQL Server 2022',
    host: 'localhost',
    port: 1433,
    database: 'testdb',
    icon: '🗄️',
    color: 'sqlserver',
  },
];

export const DEFAULT_CREDENTIALS = {
  username: 'scott',
  password: 'tiger',
};
