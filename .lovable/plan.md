

# 자연어 → SQL 자동 생성 기능 구현 계획

## 개요
사용자가 자연어로 질문을 입력하면 Gemini API를 통해 SQL 쿼리를 자동으로 생성하는 기능을 구현합니다. API 키는 설정 UI에서 입력하고 로컬 스토리지에 저장됩니다.

---

## 아키텍처

```text
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   사용자 입력    │         │  Gemini API     │         │   SQL 에디터    │
│  "emp 테이블의  │ ──────▶ │  (자연어→SQL)   │ ──────▶ │  SELECT * FROM  │
│   모든 사원"    │         │                 │         │  emp;           │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## UI/UX 설계

### 자연어 입력 영역
SQL 에디터 상단에 자연어 입력창을 배치합니다:

```text
┌─────────────────────────────────────────────────────────────────┐
│ 💬 자연어로 SQL 생성                                             │
│ ┌───────────────────────────────────────────────────┬─────────┐│
│ │ "emp 테이블에서 급여가 3000 이상인 사원 조회"     │ ✨ 생성 ││
│ └───────────────────────────────────────────────────┴─────────┘│
│                                                                 │
│ -- 생성된 SQL 쿼리                                              │
│ SELECT * FROM emp WHERE sal >= 3000;                           │
└─────────────────────────────────────────────────────────────────┘
```

### API 키 설정 (연결 관리 모달)
연결 관리 모달에 "AI 설정" 탭을 추가합니다:

- Gemini API 키 입력 필드 (마스킹 처리)
- 연결 테스트 버튼
- API 키는 로컬 스토리지에 안전하게 저장

---

## 구현 단계

### 1단계: 스토어 확장
`src/store/sqlEditorStore.ts`에 AI 관련 상태를 추가합니다.

**추가 상태:**
- `geminiApiKey: string` - API 키 저장
- `isGenerating: boolean` - 생성 중 상태
- `naturalLanguageInput: string` - 자연어 입력값

**추가 액션:**
- `setGeminiApiKey(key: string)` - API 키 설정
- `generateSql(prompt: string)` - SQL 생성 실행
- `setNaturalLanguageInput(input: string)` - 입력값 설정

### 2단계: Gemini API 서비스 생성
`src/services/aiService.ts` 파일을 새로 생성합니다.

**기능:**
- Gemini API 호출 함수
- 프롬프트 엔지니어링 (DBMS 타입에 맞는 SQL 생성)
- 에러 처리 및 재시도 로직

**프롬프트 전략:**
```
당신은 SQL 전문가입니다.
현재 데이터베이스: {DBMS 타입} (Oracle/MySQL/PostgreSQL 등)
테이블 정보: {연결된 DB의 테이블 목록 - 가능하면}

사용자 요청: "{자연어 입력}"

위 요청을 {DBMS 타입}에 맞는 SQL 쿼리로 변환해주세요.
SQL 쿼리만 반환하고, 설명은 제외해주세요.
```

### 3단계: 자연어 입력 UI 컴포넌트
`src/components/NaturalLanguageInput.tsx` 파일을 새로 생성합니다.

**컴포넌트 구성:**
- 텍스트 입력 필드 (Textarea)
- "SQL 생성" 버튼 (로딩 상태 포함)
- 생성 중 Spinner 표시
- 에러 메시지 표시
- API 키 미설정 시 안내 메시지

### 4단계: 연결 관리 모달 확장
`src/components/ConnectionManagerModal.tsx`에 AI 설정 탭을 추가합니다.

**AI 설정 탭 내용:**
- Gemini API 키 입력 필드 (password type)
- API 키 표시/숨기기 토글
- 연결 테스트 버튼
- API 키 가져오기 안내 링크

### 5단계: 메인 페이지 통합
`src/pages/Index.tsx`에 자연어 입력 컴포넌트를 배치합니다.

---

## 기술적 세부사항

### Gemini API 호출 예시

```typescript
// src/services/aiService.ts
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function generateSQL(
  prompt: string,
  dbmsType: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = `당신은 ${dbmsType} SQL 전문가입니다.
사용자의 자연어 요청을 ${dbmsType}에 맞는 SQL 쿼리로 변환해주세요.
SQL 쿼리만 반환하고, 마크다운 코드 블록이나 설명은 제외해주세요.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: systemPrompt },
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      }
    })
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

### API 키 저장 방식

API 키는 로컬 스토리지에 저장됩니다:
- Zustand persist 미들웨어 활용
- 별도 키(`sql-editor-ai-settings`)로 분리 저장 가능
- 주의 문구: "API 키는 브라우저에 로컬로 저장됩니다"

---

## 구현 산출물

| 파일 | 설명 |
|------|------|
| `src/services/aiService.ts` | Gemini API 호출 서비스 (신규) |
| `src/components/NaturalLanguageInput.tsx` | 자연어 입력 UI 컴포넌트 (신규) |
| `src/store/sqlEditorStore.ts` | AI 관련 상태 추가 (수정) |
| `src/components/ConnectionManagerModal.tsx` | AI 설정 탭 추가 (수정) |
| `src/pages/Index.tsx` | 자연어 입력 컴포넌트 배치 (수정) |

---

## 사용 흐름

1. **API 키 설정**: 연결 관리 → AI 설정 탭에서 Gemini API 키 입력
2. **자연어 입력**: SQL 에디터 상단의 입력창에 자연어로 요청 작성
3. **SQL 생성**: "SQL 생성" 버튼 클릭 또는 Ctrl+G 단축키
4. **결과 확인**: 생성된 SQL이 에디터에 자동 입력됨
5. **실행**: 필요시 수정 후 Ctrl+Enter로 실행

---

## 주의사항

- API 키는 브라우저 로컬 스토리지에 저장되므로 공용 컴퓨터에서는 주의
- Gemini API 호출 비용은 사용자 계정에서 차감됨
- 네트워크 오류 시 적절한 에러 메시지 표시

