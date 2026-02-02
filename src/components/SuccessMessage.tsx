import { CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SuccessMessageProps {
  affectedRows: number;
  executionTime: number;
}

export function SuccessMessage({ affectedRows, executionTime }: SuccessMessageProps) {
  return (
    <div className="space-y-3 animate-fade-in">
      {/* Status bar */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">쿼리가 성공적으로 실행되었습니다</span>
        </div>
      </div>
      
      {/* Results table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">항목</TableHead>
              <TableHead className="font-semibold">값</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">영향받은 행</TableCell>
              <TableCell className="font-mono">{affectedRows}개</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">실행 시간</TableCell>
              <TableCell className="font-mono">{executionTime.toFixed(3)}초</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}