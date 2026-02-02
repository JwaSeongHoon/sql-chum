import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIProvider, AI_PROVIDERS, DEFAULT_AI_CONFIG } from '@/types/ai';
import { generateSQL, testAPIKey } from '@/services/aiService';
import { DBMSType } from '@/types/database';

interface AIState {
  // State
  provider: AIProvider;
  apiKeys: Record<AIProvider, string>;
  models: Record<AIProvider, string>;
  isGenerating: boolean;
  naturalLanguageInput: string;
  lastError: string | null;

  // Actions
  setProvider: (provider: AIProvider) => void;
  setApiKey: (provider: AIProvider, key: string) => void;
  setModel: (provider: AIProvider, model: string) => void;
  setNaturalLanguageInput: (input: string) => void;
  clearError: () => void;
  
  // Async Actions
  generateSql: (dbmsType: DBMSType) => Promise<string | null>;
  testApiKey: (provider: AIProvider) => Promise<{ success: boolean; message: string }>;
  
  // Computed
  getCurrentApiKey: () => string;
  getCurrentModel: () => string;
  hasApiKey: (provider?: AIProvider) => boolean;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      // Initial state
      provider: DEFAULT_AI_CONFIG.provider,
      apiKeys: DEFAULT_AI_CONFIG.apiKeys,
      models: DEFAULT_AI_CONFIG.models,
      isGenerating: false,
      naturalLanguageInput: '',
      lastError: null,

      // Actions
      setProvider: (provider) => set({ provider }),
      
      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),
      
      setModel: (provider, model) =>
        set((state) => ({
          models: { ...state.models, [provider]: model },
        })),
      
      setNaturalLanguageInput: (input) => set({ naturalLanguageInput: input }),
      
      clearError: () => set({ lastError: null }),

      // Async Actions
      generateSql: async (dbmsType) => {
        const { provider, apiKeys, models, naturalLanguageInput } = get();
        const apiKey = apiKeys[provider];
        const model = models[provider];

        if (!naturalLanguageInput.trim()) {
          set({ lastError: '자연어 입력이 비어있습니다.' });
          return null;
        }

        if (!apiKey) {
          set({ lastError: `${AI_PROVIDERS[provider].displayName} API 키가 설정되지 않았습니다.` });
          return null;
        }

        set({ isGenerating: true, lastError: null });

        try {
          const sql = await generateSQL({
            prompt: naturalLanguageInput,
            dbmsType,
            provider,
            model,
            apiKey,
          });
          
          set({ isGenerating: false });
          return sql;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'SQL 생성에 실패했습니다.';
          set({ isGenerating: false, lastError: message });
          return null;
        }
      },

      testApiKey: async (provider) => {
        const { apiKeys } = get();
        const apiKey = apiKeys[provider];
        
        return await testAPIKey({ provider, apiKey });
      },

      // Computed
      getCurrentApiKey: () => {
        const { provider, apiKeys } = get();
        return apiKeys[provider];
      },

      getCurrentModel: () => {
        const { provider, models } = get();
        return models[provider];
      },

      hasApiKey: (provider) => {
        const state = get();
        const targetProvider = provider || state.provider;
        return !!state.apiKeys[targetProvider];
      },
    }),
    {
      name: 'sql-editor-ai-storage',
      partialize: (state) => ({
        provider: state.provider,
        apiKeys: state.apiKeys,
        models: state.models,
      }),
    }
  )
);
