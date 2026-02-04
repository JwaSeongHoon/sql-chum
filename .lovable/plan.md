# 자연어 → SQL 자동 생성 기능 구현 계획 (다중 AI 제공자 지원)

## 개요

사용자가 자연어로 질문을 입력하면 선택한 AI 제공자(ChatGPT, Claude, Gemini)를 통해 SQL 쿼리를 자동으로 생성하는 기능을 구현합니다. API 키는 설정 UI에서 입력하고 로컬 스토리지에 저장됩니다.

## 아키텍처

```text
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   사용자 입력    │         │   AI 제공자     │         │   SQL 에디터    │
│  "emp 테이블의  │ ──────▶ │  ChatGPT/Claude │ ──────▶ │  SELECT * FROM  │
│   모든 사원"    │         │  /Gemini        │         │  emp;           │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## 지원 AI 제공자

| 제공자             | 모델                | API 엔드포인트                    |
| ------------------ | ------------------- | --------------------------------- |
| OpenAI (ChatGPT)   | gpt-4o, gpt-4o-mini | api.openai.com                    |
| Anthropic (Claude) | claude-3-5-sonnet   | api.anthropic.com                 |
| Google (Gemini)    | gemini-2.0-flash    | generativelanguage.googleapis.com |

---

## UI/UX 설계

### 자연어 입력 영역

SQL 에디터 상단에 자연어 입력창을 배치합니다:

```text
┌─────────────────────────────────────────────────────────────────┐
│ ✨ AI로 SQL 생성                          [ChatGPT ▼] [⚙️ 설정]│
│ ┌───────────────────────────────────────────────────┬─────────┐│
│ │ "emp 테이블에서 급여가 3000 이상인 사원 조회"     │ 🚀 생성 ││
│ └───────────────────────────────────────────────────┴─────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### AI 설정 모달

연결 관리 모달에 "AI 설정" 탭을 추가하거나 별도의 설정 모달을 생성합니다:

- AI 제공자 선택 (OpenAI / Anthropic / Google)
- API 키 입력 필드 (마스킹 처리, 표시/숨기기 토글)
- 모델 선택 드롭다운
- API 키 테스트 버튼
- API 키 가져오기 안내 링크

---

## 구현 단계

### 1단계: AI 타입 정의

`src/types/ai.ts` 파일을 새로 생성합니다.

**정의 항목:**

- `AIProvider` 타입 (openai, anthropic, google)
- `AIConfig` 인터페이스 (제공자, API 키, 모델)
- `AIProviderConfig` 상수 (각 제공자별 모델 목록, 기본값)

### 2단계: 스토어 확장

`src/store/sqlEditorStore.ts`에 AI 관련 상태를 추가합니다.

**추가 상태:**

- `aiProvider: AIProvider` - 선택된 AI 제공자
- `aiApiKeys: Record<AIProvider, string>` - 제공자별 API 키
- `aiModel: Record<AIProvider, string>` - 제공자별 선택 모델
- `isGenerating: boolean` - 생성 중 상태
- `naturalLanguageInput: string` - 자연어 입력값

**추가 액션:**

- `setAIProvider(provider)` - AI 제공자 변경
- `setAIApiKey(provider, key)` - API 키 설정
- `setAIModel(provider, model)` - 모델 설정
- `generateSql(prompt)` - SQL 생성 실행

### 3단계: AI 서비스 생성

`src/services/aiService.ts` 파일을 새로 생성합니다.

**구현 기능:**

- 각 제공자별 API 호출 함수
- 공통 프롬프트 엔지니어링 (DBMS 타입에 맞는 SQL 생성)
- API 키 유효성 테스트 함수
- 에러 처리 및 재시도 로직

**프롬프트 전략:**

```
당신은 {DBMS 타입} SQL 전문가입니다.
사용자의 자연어 요청을 {DBMS 타입}에 맞는 SQL 쿼리로 변환해주세요.
SQL 쿼리만 반환하고, 마크다운 코드 블록이나 설명은 제외해주세요.
```

### 4단계: 자연어 입력 UI 컴포넌트

`src/components/NaturalLanguageInput.tsx` 파일을 새로 생성합니다.

**컴포넌트 구성:**

- 텍스트 입력 필드 (Textarea 또는 Input)
- AI 제공자 선택 드롭다운
- "SQL 생성" 버튼 (로딩 상태 포함)
- 설정 버튼 (모달 열기)
- API 키 미설정 시 안내 메시지

### 5단계: AI 설정 모달

`src/components/AISettingsModal.tsx` 파일을 새로 생성합니다.

**모달 내용:**

- 탭 또는 섹션별로 각 AI 제공자 설정
- API 키 입력 필드 (password type, 표시/숨기기 토글)
- 모델 선택 드롭다운
- 연결 테스트 버튼
- API 키 발급 가이드 링크

### 6단계: 메인 페이지 통합

`src/pages/Index.tsx`에 자연어 입력 컴포넌트를 배치합니다.

---

## 기술적 세부사항

### 각 AI 제공자 API 호출 예시

**OpenAI (ChatGPT):**

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.1
  })
});
```

**Anthropic (Claude):**

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  })
});
```

**Google (Gemini):**

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
    })
  }
);
```

### API 키 저장 방식

API 키는 로컬 스토리지에 저장됩니다:

- Zustand persist 미들웨어 활용
- 각 제공자별로 별도 저장
- 주의 문구: "API 키는 브라우저에 로컬로 저장됩니다"

---

## 구현 산출물

| 파일                                      | 설명                             |
| ----------------------------------------- | -------------------------------- |
| `src/types/ai.ts`                         | AI 관련 타입 정의 (신규)         |
| `src/services/aiService.ts`               | AI API 호출 서비스 (신규)        |
| `src/components/NaturalLanguageInput.tsx` | 자연어 입력 UI 컴포넌트 (신규)   |
| `src/components/AISettingsModal.tsx`      | AI 설정 모달 (신규)              |
| `src/store/sqlEditorStore.ts`             | AI 관련 상태 추가 (수정)         |
| `src/pages/Index.tsx`                     | 자연어 입력 컴포넌트 배치 (수정) |

---

## 사용 흐름

1. **API 키 설정**: 설정 버튼 클릭 → AI 설정 모달에서 원하는 제공자의 API 키 입력
2. **제공자 선택**: 자연어 입력창 옆 드롭다운에서 AI 제공자 선택
3. **자연어 입력**: 입력창에 자연어로 요청 작성
4. **SQL 생성**: "생성" 버튼 클릭 또는 Ctrl+G 단축키
5. **결과 확인**: 생성된 SQL이 에디터에 자동 입력됨
6. **실행**: 필요시 수정 후 Ctrl+Enter로 실행

---

## 주의사항

- API 키는 브라우저 로컬 스토리지에 저장되므로 공용 컴퓨터에서는 주의
- 각 AI 제공자의 API 호출 비용은 사용자 계정에서 차감됨
- Claude API는 브라우저에서 직접 호출 시 CORS 제한이 있을 수 있음 (dangerouslyAllowBrowser 헤더 필요)
- 네트워크 오류 시 적절한 에러 메시지 표시
