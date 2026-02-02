import { AIProvider, AI_PROVIDERS } from '@/types/ai';
import { DBMSType } from '@/types/database';

interface GenerateSQLOptions {
  prompt: string;
  dbmsType: DBMSType;
  provider: AIProvider;
  model: string;
  apiKey: string;
}

interface TestAPIKeyOptions {
  provider: AIProvider;
  apiKey: string;
}

function buildSystemPrompt(dbmsType: DBMSType): string {
  const dbmsNames: Record<DBMSType, string> = {
    oracle: 'Oracle',
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    mariadb: 'MariaDB',
    sqlserver: 'SQL Server',
  };

  return `당신은 ${dbmsNames[dbmsType]} SQL 전문가입니다.
사용자의 자연어 요청을 ${dbmsNames[dbmsType]}에 맞는 SQL 쿼리로 변환해주세요.

중요 규칙:
1. SQL 쿼리만 반환하세요. 마크다운 코드 블록(\`\`\`)이나 설명은 절대 포함하지 마세요.
2. ${dbmsNames[dbmsType]} 문법에 맞는 유효한 SQL만 생성하세요.
3. 테이블이나 컬럼명이 명시되지 않으면 일반적인 이름을 사용하세요.
4. 복잡한 쿼리는 가독성을 위해 적절히 줄바꿈하세요.`;
}

async function callOpenAI(prompt: string, systemPrompt: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API 오류: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

async function callAnthropic(prompt: string, systemPrompt: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API 오류: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text?.trim() || '';
}

async function callGoogle(prompt: string, systemPrompt: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n사용자 요청: ${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Google API 오류: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

function cleanSQLResponse(sql: string): string {
  // Remove markdown code blocks if present
  let cleaned = sql.replace(/```sql\n?/gi, '').replace(/```\n?/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

export async function generateSQL(options: GenerateSQLOptions): Promise<string> {
  const { prompt, dbmsType, provider, model, apiKey } = options;

  if (!apiKey) {
    throw new Error(`${AI_PROVIDERS[provider].displayName} API 키가 설정되지 않았습니다.`);
  }

  if (!prompt.trim()) {
    throw new Error('자연어 입력이 비어있습니다.');
  }

  const systemPrompt = buildSystemPrompt(dbmsType);

  let sql: string;

  switch (provider) {
    case 'openai':
      sql = await callOpenAI(prompt, systemPrompt, model, apiKey);
      break;
    case 'anthropic':
      sql = await callAnthropic(prompt, systemPrompt, model, apiKey);
      break;
    case 'google':
      sql = await callGoogle(prompt, systemPrompt, model, apiKey);
      break;
    default:
      throw new Error(`지원하지 않는 AI 제공자: ${provider}`);
  }

  return cleanSQLResponse(sql);
}

export async function testAPIKey(options: TestAPIKeyOptions): Promise<{ success: boolean; message: string }> {
  const { provider, apiKey } = options;

  if (!apiKey) {
    return { success: false, message: 'API 키를 입력해주세요.' };
  }

  try {
    const testPrompt = 'SELECT 1';
    const systemPrompt = '간단한 테스트입니다. "OK"라고만 응답하세요.';

    switch (provider) {
      case 'openai':
        await callOpenAI(testPrompt, systemPrompt, 'gpt-4o-mini', apiKey);
        break;
      case 'anthropic':
        await callAnthropic(testPrompt, systemPrompt, 'claude-3-5-haiku-20241022', apiKey);
        break;
      case 'google':
        await callGoogle(testPrompt, systemPrompt, 'gemini-2.0-flash', apiKey);
        break;
    }

    return { success: true, message: 'API 키가 유효합니다.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'API 키 테스트에 실패했습니다.',
    };
  }
}
