import { DBMSType, DBDriver } from '../types';
import { oracleDriver } from './oracle';
import { mysqlDriver } from './mysql';
import { postgresqlDriver } from './postgresql';
import { sqlserverDriver } from './sqlserver';

const drivers: Record<DBMSType, DBDriver> = {
  oracle: oracleDriver,
  mysql: mysqlDriver,
  postgresql: postgresqlDriver,
  mariadb: mysqlDriver, // MariaDB는 MySQL 드라이버 사용
  sqlserver: sqlserverDriver,
};

export function getDriver(type: DBMSType): DBDriver {
  const driver = drivers[type];
  if (!driver) {
    throw new Error(`Unsupported DBMS type: ${type}`);
  }
  return driver;
}

export { oracleDriver, mysqlDriver, postgresqlDriver, sqlserverDriver };
