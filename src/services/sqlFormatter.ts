import { format } from 'sql-formatter';
import { DBMSType } from '@/types/database';

const dialectMap: Record<DBMSType, 'sql' | 'mysql' | 'mariadb' | 'postgresql' | 'tsql'> = {
  oracle: 'sql',
  mysql: 'mysql',
  mariadb: 'mariadb',
  postgresql: 'postgresql',
  sqlserver: 'tsql',
};

export function formatSQL(sql: string, dbms: DBMSType = 'oracle'): string {
  try {
    return format(sql, {
      language: dialectMap[dbms],
      tabWidth: 2,
      useTabs: false,
      keywordCase: 'upper',
      indentStyle: 'standard',
      logicalOperatorNewline: 'before',
      expressionWidth: 50,
    });
  } catch {
    // If formatting fails, return original
    return sql;
  }
}
