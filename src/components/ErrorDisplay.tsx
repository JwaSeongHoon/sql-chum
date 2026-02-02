import { AlertCircle } from 'lucide-react';
import { QueryError } from '@/types/query';

interface ErrorDisplayProps {
  error: QueryError;
  sql: string;
}

export function ErrorDisplay({ error, sql }: ErrorDisplayProps) {
  const lines = sql.split('\n');
  const errorLine = error.line ? lines[error.line - 1] : null;
  
  return (
    <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-destructive/10 rounded-full">
          <AlertCircle className="w-5 h-5 text-destructive" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-destructive mb-1">
            쿼리 실행 중 오류:
          </h4>
          <p className="text-sm text-foreground font-medium">
            {error.code}: {error.message}
          </p>
          
          {errorLine && error.line && (
            <div className="mt-3 bg-card rounded-md p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                라인 {error.line}, 위치 {error.position || 1}
              </p>
              <pre className="text-sm font-mono text-foreground overflow-x-auto">
                {errorLine}
              </pre>
              {error.position && (
                <pre className="text-sm font-mono text-destructive">
                  {' '.repeat(error.position - 1)}^
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
