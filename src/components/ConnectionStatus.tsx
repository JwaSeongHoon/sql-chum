import { RefreshCw } from 'lucide-react';
import { useSQLEditorStore } from '@/store/sqlEditorStore';
import { DBMS_CONFIGS, DEFAULT_CREDENTIALS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const { connection, selectedDbms, connect } = useSQLEditorStore();
  
  const config = DBMS_CONFIGS.find(c => c.id === selectedDbms);
  
  const getStatusText = () => {
    switch (connection.status) {
      case 'connected':
        return `연결됨 (${DEFAULT_CREDENTIALS.username}@${config?.name?.toLowerCase()}:${config?.port})`;
      case 'connecting':
        return '연결 중...';
      case 'error':
        return connection.message || '연결 오류';
      default:
        return '연결 안됨';
    }
  };
  
  const getStatusDotClass = () => {
    switch (connection.status) {
      case 'connected':
        return 'status-connected';
      case 'connecting':
        return 'status-connecting';
      case 'error':
        return 'bg-destructive';
      default:
        return 'status-disconnected';
    }
  };
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground">상태:</span>
      
      <div className="status-indicator">
        <span className={cn('status-dot', getStatusDotClass())} />
        <span className={cn(
          'text-sm',
          connection.status === 'connected' && 'text-success',
          connection.status === 'error' && 'text-destructive',
          connection.status === 'connecting' && 'text-warning',
          connection.status === 'disconnected' && 'text-muted-foreground'
        )}>
          {getStatusText()}
        </span>
      </div>
      
      {connection.status !== 'connecting' ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => connect()}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      ) : (
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-warning" />
      )}
    </div>
  );
}
