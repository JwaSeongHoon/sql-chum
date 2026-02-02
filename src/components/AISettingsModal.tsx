import { useState } from 'react';
import { Eye, EyeOff, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIStore } from '@/store/aiStore';
import { AI_PROVIDERS, AIProvider } from '@/types/ai';
import { toast } from 'sonner';

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISettingsModal({ open, onOpenChange }: AISettingsModalProps) {
  const [showApiKeys, setShowApiKeys] = useState<Record<AIProvider, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
  });
  const [testingProvider, setTestingProvider] = useState<AIProvider | null>(null);

  const { apiKeys, models, setApiKey, setModel, testApiKey } = useAIStore();

  const handleTestApiKey = async (provider: AIProvider) => {
    if (!apiKeys[provider]) {
      toast.error('API 키를 입력해주세요.');
      return;
    }

    setTestingProvider(provider);
    const result = await testApiKey(provider);
    setTestingProvider(null);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const toggleShowApiKey = (provider: AIProvider) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const renderProviderSettings = (provider: AIProvider) => {
    const providerInfo = AI_PROVIDERS[provider];
    const apiKey = apiKeys[provider];
    const model = models[provider];
    const showKey = showApiKeys[provider];
    const isTesting = testingProvider === provider;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${provider}-api-key`}>API 키</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id={`${provider}-api-key`}
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(provider, e.target.value)}
                placeholder={`${providerInfo.displayName} API 키 입력`}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleShowApiKey(provider)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => handleTestApiKey(provider)}
              disabled={!apiKey || isTesting}
              className="min-w-[80px]"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : apiKey ? (
                '테스트'
              ) : (
                '테스트'
              )}
            </Button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <a
              href={providerInfo.apiKeyGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline"
            >
              API 키 발급하기
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${provider}-model`}>모델</Label>
          <Select value={model} onValueChange={(value) => setModel(provider, value)}>
            <SelectTrigger id={`${provider}-model`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providerInfo.models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {apiKey ? (
            <>
              <CheckCircle className="h-3 w-3 text-primary" />
              <span className="text-primary">API 키 설정됨</span>
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">API 키 미설정</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI 설정</DialogTitle>
          <DialogDescription>
            자연어 SQL 생성을 위한 AI 제공자 설정
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="openai" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            {Object.values(AI_PROVIDERS).map((provider) => (
              <TabsTrigger
                key={provider.id}
                value={provider.id}
                className="flex items-center gap-1"
              >
                {provider.displayName}
                {apiKeys[provider.id] && (
                  <CheckCircle className="h-3 w-3 text-primary" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.values(AI_PROVIDERS).map((provider) => (
            <TabsContent key={provider.id} value={provider.id} className="mt-4">
              {renderProviderSettings(provider.id)}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">
            ⚠️ API 키는 브라우저 로컬 스토리지에 저장됩니다. 공용 컴퓨터에서는 사용에 주의해주세요.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
