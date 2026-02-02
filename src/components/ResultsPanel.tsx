import { Database, FileText } from 'lucide-react';
import { useSQLEditorStore } from '@/store/sqlEditorStore';
import { DataTable } from './DataTable';
import { ErrorDisplay } from './ErrorDisplay';
import { SuccessMessage } from './SuccessMessage';

export function ResultsPanel() {
  const { result, sql, isExecuting } = useSQLEditorStore();
  
  // Loading state
  if (isExecuting) {
    return (
      <div className="bg-card rounded-lg border border-border p-8">
        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="relative">
            <Database className="w-10 h-10 animate-pulse" />
            <div className="absolute inset-0 animate-ping">
              <Database className="w-10 h-10 opacity-30" />
            </div>
          </div>
          <p className="text-sm font-medium">쿼리 실행 중...</p>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!result) {
    return (
      <div className="bg-card rounded-lg border border-border p-12">
        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <FileText className="w-12 h-12 opacity-40" />
          <div className="text-center">
            <p className="font-medium text-foreground">아직 결과가 없습니다.</p>
            <p className="text-sm mt-1">SQL 쿼리를 실행하여 여기에서 결과를 확인하세요.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (!result.success && result.error) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <ErrorDisplay error={result.error} sql={sql} />
      </div>
    );
  }
  
  // DML success (no data, just affected rows)
  if (result.success && result.affectedRows !== undefined && !result.data) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <SuccessMessage 
          affectedRows={result.affectedRows} 
          executionTime={result.executionTime || 0} 
        />
      </div>
    );
  }
  
  // SELECT results
  if (result.success && result.data) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <DataTable />
      </div>
    );
  }
  
  return null;
}
