
# 로컬 Oracle DB 실제 연결을 위한 프록시 서버 구현 계획

## 개요
브라우저에서 로컬 Oracle 데이터베이스에 직접 연결할 수 없으므로, Node.js 기반 프록시 서버를 구현하여 SQL 편집기와 실제 DB를 연결합니다.

---

## 아키텍처

```text
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React 앱      │  HTTP   │  Node.js 프록시  │  TCP    │   Oracle DB     │
│   (브라우저)    │ ──────▶ │  (localhost:    │ ──────▶ │   (localhost:   │
│                 │  :3001  │   3001)         │         │    1521)        │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## 구현 단계

### 1단계: 프록시 서버 프로젝트 생성
별도의 `sql-proxy-server` 폴더에 Node.js 프로젝트를 생성합니다.

**파일 구조:**
```
sql-proxy-server/
├── package.json
├── src/
│   ├── index.ts          # Express 서버 진입점
│   ├── routes/
│   │   └── sql.ts        # SQL 실행 API 라우트
│   ├── drivers/
│   │   ├── oracle.ts     # Oracle 드라이버 (oracledb)
│   │   ├── mysql.ts      # MySQL 드라이버 (mysql2)
│   │   ├── postgresql.ts # PostgreSQL 드라이버 (pg)
│   │   └── index.ts      # 드라이버 팩토리
│   └── types/
│       └── index.ts      # 공통 타입 정의
└── tsconfig.json
```

### 2단계: Oracle 드라이버 구현
Oracle Instant Client와 `oracledb` npm 패키지를 사용합니다.

**의존성:**
- `express` - HTTP 서버
- `cors` - CORS 처리
- `oracledb` - Oracle 연결 (Oracle Instant Client 필요)
- `mysql2` - MySQL/MariaDB 연결 (향후)
- `pg` - PostgreSQL 연결 (향후)
- `mssql` - SQL Server 연결 (향후)

**API 엔드포인트:**
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/connect | 연결 테스트 |
| POST | /api/execute | SQL 실행 |
| POST | /api/disconnect | 연결 해제 |

### 3단계: 프론트엔드 수정
`src/services/sqlExecutor.ts`를 수정하여 프록시 서버 API를 호출합니다.

**변경 사항:**
- Mock 데이터 로직 제거
- `fetch` 또는 `axios`를 사용하여 프록시 서버 API 호출
- 프록시 서버 URL을 환경 설정으로 관리

### 4단계: 연결 관리자 UI 개선
- 프록시 서버 상태 표시 (연결됨/연결 안됨)
- 프록시 서버 URL 설정 옵션 추가
- 실제 연결 테스트 결과 표시

---

## 기술적 세부사항

### 프록시 서버 코드 예시 (Oracle)

```typescript
// sql-proxy-server/src/drivers/oracle.ts
import oracledb from 'oracledb';

export async function executeOracleQuery(
  config: ConnectionConfig,
  sql: string
): Promise<QueryResult> {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: config.username,
      password: config.password,
      connectString: `${config.host}:${config.port}/${config.database}`
    });
    
    const result = await connection.execute(sql, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    
    return {
      success: true,
      columns: result.metaData?.map(m => m.name) || [],
      rows: result.rows || [],
      rowCount: result.rows?.length || 0
    };
  } finally {
    if (connection) await connection.close();
  }
}
```

### 프론트엔드 API 호출 예시

```typescript
// src/services/sqlExecutor.ts
const PROXY_URL = 'http://localhost:3001';

export async function executeQuery(
  sql: string, 
  connection: DBMSConfig
): Promise<QueryResult> {
  const response = await fetch(`${PROXY_URL}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dbms: connection.type,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: connection.password,
      sql: sql
    })
  });
  
  return response.json();
}
```

---

## 사전 요구사항 (사용자 환경)

Oracle DB 연결을 위해 다음이 필요합니다:

1. **Oracle Instant Client** 설치
   - [Oracle 다운로드 페이지](https://www.oracle.com/database/technologies/instant-client.html)에서 다운로드
   - 환경 변수 설정 필요

2. **Node.js 18+** 설치

3. **프록시 서버 실행**
   ```bash
   cd sql-proxy-server
   npm install
   npm run dev
   ```

---

## 구현 산출물

| 파일 | 설명 |
|------|------|
| `sql-proxy-server/package.json` | 프록시 서버 의존성 |
| `sql-proxy-server/src/index.ts` | Express 서버 메인 |
| `sql-proxy-server/src/routes/sql.ts` | SQL API 라우트 |
| `sql-proxy-server/src/drivers/oracle.ts` | Oracle 드라이버 |
| `sql-proxy-server/src/drivers/index.ts` | 드라이버 팩토리 |
| `src/services/sqlExecutor.ts` | 프론트엔드 API 클라이언트 (수정) |
| `src/store/sqlEditorStore.ts` | 프록시 URL 설정 추가 (수정) |
| `src/components/ConnectionManagerModal.tsx` | 프록시 설정 UI 추가 (수정) |

---

## 주의사항

- 프록시 서버는 **로컬에서 별도로 실행**해야 합니다
- 비밀번호가 네트워크로 전송되므로 **로컬 환경에서만 사용** 권장
- 프로덕션 환경에서는 HTTPS와 인증 추가 필요
