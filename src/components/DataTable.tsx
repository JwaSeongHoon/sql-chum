import { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Table as TableIcon
} from 'lucide-react';
import { useSQLEditorStore } from '@/store/sqlEditorStore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ROWS_PER_PAGE = 100;

export function DataTable() {
  const { result } = useSQLEditorStore();
  const { toast } = useToast();
  
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  
  const data = result?.data;
  
  const sortedRows = useMemo(() => {
    if (!data?.rows) return [];
    if (sortColumn === null) return data.rows;
    
    return [...data.rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.rows, sortColumn, sortDirection]);
  
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return sortedRows.slice(start, start + ROWS_PER_PAGE);
  }, [sortedRows, currentPage]);
  
  const totalPages = Math.ceil(sortedRows.length / ROWS_PER_PAGE);
  
  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };
  
  const handleCopyResults = async () => {
    if (!data) return;
    
    const text = [
      data.columns.join('\t'),
      ...sortedRows.map(row => row.map(cell => cell ?? '').join('\t'))
    ].join('\n');
    
    await navigator.clipboard.writeText(text);
    toast({
      title: '복사 완료',
      description: '결과가 클립보드에 복사되었습니다.',
    });
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    const csvContent = [
      data.columns.join(','),
      ...sortedRows.map(row => 
        row.map(cell => {
          if (cell === null) return '';
          const str = String(cell);
          return str.includes(',') ? `"${str}"` : str;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_result_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: '내보내기 완료',
      description: 'CSV 파일이 다운로드되었습니다.',
    });
  };
  
  if (!data) return null;
  
  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <TableIcon className="w-4 h-4" />
          <span>실행 시간: <strong className="text-foreground">{data.executionTime.toFixed(3)}초</strong></span>
        </span>
        <span className="text-border">|</span>
        <span>
          행: <strong className="text-foreground">{data.rowCount}개</strong>
        </span>
      </div>
      
      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {data.columns.map((column, idx) => (
                  <TableHead
                    key={idx}
                    onClick={() => handleSort(idx)}
                    className="cursor-pointer select-none whitespace-nowrap font-semibold"
                  >
                    <span className="flex items-center gap-1.5">
                      {column}
                      {sortColumn === idx ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <TableCell 
                      key={cellIdx}
                      className={cn(
                        'whitespace-nowrap font-mono text-sm',
                        cell === null && 'text-muted-foreground italic'
                      )}
                    >
                      {cell === null ? 'NULL' : String(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Footer with pagination and actions */}
      <div className="flex items-center justify-between">
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyResults}
            className="gap-1.5"
          >
            <Copy className="w-4 h-4" />
            결과 복사
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            CSV 내보내기
          </Button>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground mr-2">
              {((currentPage - 1) * ROWS_PER_PAGE) + 1} - {Math.min(currentPage * ROWS_PER_PAGE, sortedRows.length)} / {sortedRows.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
