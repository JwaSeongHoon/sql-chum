import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, Trash2, Play } from 'lucide-react';
import { useSQLEditorStore } from '@/store/sqlEditorStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface QueryHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QueryHistoryModal({ open, onOpenChange }: QueryHistoryModalProps) {
  const { history, loadFromHistory, clearHistory } = useSQLEditorStore();
  
  const handleSelect = (item: typeof history[0]) => {
    loadFromHistory(item);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              쿼리 히스토리
            </DialogTitle>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-muted-foreground hover:text-destructive gap-1"
              >
                <Trash2 className="w-4 h-4" />
                모두 삭제
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>아직 실행된 쿼리가 없습니다.</p>
              <p className="text-sm">SQL을 실행하면 여기에 기록됩니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    'hover:bg-accent hover:border-primary/30',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50',
                    item.success ? 'border-border' : 'border-destructive/30 bg-destructive/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {item.success ? (
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {item.dbms}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </div>
                  
                  <pre className="text-sm font-mono text-foreground truncate mb-2">
                    {item.sql.length > 80 ? item.sql.slice(0, 80) + '...' : item.sql}
                  </pre>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {item.executionTime && (
                      <span>⏱️ {item.executionTime.toFixed(3)}초</span>
                    )}
                    {item.rowCount !== undefined && (
                      <span>📊 {item.rowCount}행</span>
                    )}
                    {item.error && (
                      <span className="text-destructive truncate">❌ {item.error}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
