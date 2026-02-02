import { useState } from 'react';
import { Play, Sparkles, Trash2, Download, History, Loader2 } from 'lucide-react';
import { useSQLEditorStore } from '@/store/sqlEditorStore';
import { formatSQL } from '@/services/sqlFormatter';
import { Button } from '@/components/ui/button';
import { QueryHistoryModal } from './QueryHistoryModal';

export function ActionButtons() {
  const { 
    sql, 
    setSql, 
    execute, 
    clearEditor, 
    isExecuting, 
    connection, 
    selectedDbms,
    result 
  } = useSQLEditorStore();
  
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const canExecute = sql.trim() && connection.status === 'connected' && !isExecuting;
  const hasSelectResult = result?.success && result.data?.rows && result.data.rows.length > 0;
  
  const handleFormat = () => {
    if (sql.trim()) {
      const formatted = formatSQL(sql, selectedDbms);
      setSql(formatted);
    }
  };
  
  const handleExportCSV = () => {
    if (!result?.data) return;
    
    const { columns, rows } = result.data;
    
    // Build CSV content
    const csvContent = [
      columns.join(','),
      ...rows.map(row => 
        row.map(cell => {
          if (cell === null) return '';
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return String(cell);
        }).join(',')
      )
    ].join('\n');
    
    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_result_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <>
      <div className="action-button-group py-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleFormat}
          disabled={!sql.trim()}
          className="gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          SQL 포맷팅
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={clearEditor}
          disabled={!sql.trim()}
          className="gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          지우기
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={execute}
          disabled={!canExecute}
          className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              실행 중...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              실행
            </>
          )}
        </Button>
        
        <div className="flex-1" />
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          disabled={!hasSelectResult}
          className="gap-1.5"
        >
          <Download className="w-4 h-4" />
          CSV 내보내기
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setHistoryOpen(true)}
          className="gap-1.5"
        >
          <History className="w-4 h-4" />
          히스토리
        </Button>
      </div>
      
      <QueryHistoryModal open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  );
}
