# SQL Proxy Server

브라우저 기반 SQL 편집기와 로컬/원격 데이터베이스를 연결하는 프록시 서버입니다.

## 사전 요구사항

### 공통
- Node.js 18 이상

### Oracle 연결 시
- Oracle Instant Client 설치 필요
- 환경 변수 설정:
  - Windows: `PATH`에 Instant Client 경로 추가
  - macOS/Linux: `LD_LIBRARY_PATH` 또는 `DYLD_LIBRARY_PATH` 설정

## 설치

```bash
cd sql-proxy-server
npm install
```

## 실행

### 개발 모드 (자동 재시작)
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm run build
npm start
```

## API 엔드포인트

### GET /api/health
서버 상태 확인

**응답:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "supportedDBMS": ["oracle", "mysql", "postgresql", "mariadb", "sqlserver"]
}
```

### POST /api/connect
데이터베이스 연결 테스트

**요청:**
```json
{
  "type": "oracle",
  "host": "localhost",
  "port": 1521,
  "database": "XE",
  "username": "scott",
  "password": "tiger"
}
```

**응답:**
```json
{
  "success": true,
  "message": "성공적으로 연결되었습니다",
  "version": "Oracle Database 11g Express Edition"
}
```

### POST /api/execute
SQL 쿼리 실행

**요청:**
```json
{
  "type": "oracle",
  "host": "localhost",
  "port": 1521,
  "database": "XE",
  "username": "scott",
  "password": "tiger",
  "sql": "SELECT * FROM emp"
}
```

**응답 (SELECT):**
```json
{
  "success": true,
  "data": {
    "columns": ["EMPNO", "ENAME", "JOB", "MGR", "HIREDATE", "SAL", "COMM", "DEPTNO"],
    "rows": [
      [7369, "SMITH", "CLERK", 7902, "1980-12-17", 800, null, 20]
    ],
    "rowCount": 14,
    "executionTime": 0.045
  }
}
```

**응답 (DML/DDL):**
```json
{
  "success": true,
  "affectedRows": 1,
  "executionTime": 0.023
}
```

## 지원 DBMS

| DBMS | 드라이버 | 기본 포트 |
|------|---------|----------|
| Oracle | oracledb | 1521 |
| MySQL | mysql2 | 3306 |
| PostgreSQL | pg | 5432 |
| MariaDB | mysql2 | 3307 |
| SQL Server | mssql | 1433 |

## 보안 주의사항

⚠️ **이 서버는 로컬 개발 환경에서만 사용하세요.**

- 비밀번호가 평문으로 전송됩니다
- 프로덕션 환경에서는 HTTPS 및 인증 기능 추가 필요
- 외부 네트워크에 노출하지 마세요
