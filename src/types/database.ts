export type DBMSType = 'oracle' | 'mysql' | 'postgresql' | 'mariadb' | 'sqlserver';

export interface DBMSConfig {
  id: string;
  type: DBMSType;
  name: string;
  displayName: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  description?: string;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
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
  connectionId: string | null;
  message?: string;
  serverVersion?: string;
}

export const DBMS_TYPE_CONFIGS: Record<DBMSType, { icon: string; color: string; defaultPort: number }> = {
  oracle: { icon: '🔶', color: 'oracle', defaultPort: 1521 },
  mysql: { icon: '🐬', color: 'mysql', defaultPort: 3306 },
  postgresql: { icon: '🐘', color: 'postgresql', defaultPort: 5432 },
  mariadb: { icon: '🦭', color: 'mariadb', defaultPort: 3307 },
  sqlserver: { icon: '🗄️', color: 'sqlserver', defaultPort: 1433 },
};

export const DEFAULT_CONNECTIONS: DBMSConfig[] = [
  {
    id: 'default-oracle',
    type: 'oracle',
    name: 'Oracle',
    displayName: 'Oracle 11g XE',
    host: 'localhost',
    port: 1521,
    database: 'XE',
    username: 'scott',
    password: 'tiger',
    description: '기본 Oracle 연결',
    icon: '🔶',
    color: 'oracle',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'default-mysql',
    type: 'mysql',
    name: 'MySQL',
    displayName: 'MySQL 8.0',
    host: 'localhost',
    port: 3306,
    database: 'testdb',
    username: 'root',
    password: 'password',
    description: '기본 MySQL 연결',
    icon: '🐬',
    color: 'mysql',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'default-postgresql',
    type: 'postgresql',
    name: 'PostgreSQL',
    displayName: 'PostgreSQL 15',
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    username: 'postgres',
    password: 'password',
    description: '기본 PostgreSQL 연결',
    icon: '🐘',
    color: 'postgresql',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'default-mariadb',
    type: 'mariadb',
    name: 'MariaDB',
    displayName: 'MariaDB 10.11',
    host: 'localhost',
    port: 3307,
    database: 'testdb',
    username: 'root',
    password: 'password',
    description: '기본 MariaDB 연결',
    icon: '🦭',
    color: 'mariadb',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'default-sqlserver',
    type: 'sqlserver',
    name: 'SQL Server',
    displayName: 'SQL Server 2022',
    host: 'localhost',
    port: 1433,
    database: 'testdb',
    username: 'sa',
    password: 'password',
    description: '기본 SQL Server 연결',
    icon: '🗄️',
    color: 'sqlserver',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export interface ExportData {
  version: string;
  exportedAt: string;
  connections: DBMSConfig[];
  history: any[];
}
