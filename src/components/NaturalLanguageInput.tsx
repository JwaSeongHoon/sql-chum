import { useState } from 'react';
import { Sparkles, Settings, Loader2, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAIStore } from '@/store/aiStore';
import { useSQLEditorStore } from '@/store/sqlEditorStore';
import { AI_PROVIDERS, AIProvider } from '@/types/ai';
import { AISettingsModal } from './AISettingsModal';
import { toast } from 'sonner';

export function NaturalLanguageInput() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const {
    provider,
    setProvider,
    naturalLanguageInput,
    setNaturalLanguageInput,
    isGenerating,
    generateSql,
    hasApiKey,
    lastError,
    clearError,
  } = useAIStore();

  const { setSql, getSelectedConnection } = useSQLEditorStore();

  const selectedConnection = getSelectedConnection();
  const dbmsType = selectedConnection?.type || 'oracle';
  const currentApiKeySet = hasApiKey();

  const handleGenerate = async () => {
    if (!naturalLanguageInput.trim()) {
      toast.error('자연어 입력을 작성해주세요.');
      return;
    }

    if (!currentApiKeySet) {
      toast.error(`${AI_PROVIDERS[provider].displayName} API 키를 설정해주세요.`);
      setSettingsOpen(true);
      return;
    }

    const sql = await generateSql(dbmsType);
    
    if (sql) {
      setSql(sql);
      toast.success('SQL이 생성되었습니다!');
      setNaturalLanguageInput('');
    } else if (lastError) {
      toast.error(lastError);
      clearError();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      handleGenerate();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI로 SQL 생성</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={provider} onValueChange={(value) => setProvider(value as AIProvider)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AI_PROVIDERS).map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSettingsOpen(true)}
              title="AI 설정"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!currentApiKeySet && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50 border border-border">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {AI_PROVIDERS[provider].displayName} API 키를 설정해주세요.
              <Button
                variant="link"
                className="h-auto p-0 ml-1 text-xs text-primary"
                onClick={() => setSettingsOpen(true)}
              >
                설정하기
              </Button>
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            placeholder={`자연어로 SQL 쿼리를 설명하세요... (예: "emp 테이블에서 급여가 3000 이상인 사원 조회")`}
            value={naturalLanguageInput}
            onChange={(e) => setNaturalLanguageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] max-h-[120px] resize-none text-sm"
            disabled={isGenerating}
          />
          
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !naturalLanguageInput.trim()}
            className="h-auto px-4"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            현재 DBMS: <span className="text-primary font-medium">{dbmsType.toUpperCase()}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Ctrl+G 또는 Ctrl+Enter로 생성
          </span>
        </div>
      </div>

      <AISettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
