export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface AIProviderInfo {
  id: AIProvider;
  name: string;
  displayName: string;
  models: AIModel[];
  defaultModel: string;
  apiKeyGuideUrl: string;
}

export interface AIModel {
  id: string;
  name: string;
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderInfo> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    displayName: 'ChatGPT',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
    defaultModel: 'gpt-4o-mini',
    apiKeyGuideUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    displayName: 'Claude',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    apiKeyGuideUrl: 'https://console.anthropic.com/settings/keys',
  },
  google: {
    id: 'google',
    name: 'Google',
    displayName: 'Gemini',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
    defaultModel: 'gemini-2.0-flash',
    apiKeyGuideUrl: 'https://aistudio.google.com/apikey',
  },
};

export interface AIConfig {
  provider: AIProvider;
  apiKeys: Record<AIProvider, string>;
  models: Record<AIProvider, string>;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  apiKeys: {
    openai: '',
    anthropic: '',
    google: '',
  },
  models: {
    openai: AI_PROVIDERS.openai.defaultModel,
    anthropic: AI_PROVIDERS.anthropic.defaultModel,
    google: AI_PROVIDERS.google.defaultModel,
  },
};
