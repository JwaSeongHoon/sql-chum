import { CheckCircle } from 'lucide-react';

interface SuccessMessageProps {
  affectedRows: number;
  executionTime: number;
}

export function SuccessMessage({ affectedRows, executionTime }: SuccessMessageProps) {
  return (
    <div className="bg-success/5 border border-success/30 rounded-lg p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-success/10 rounded-full">
          <CheckCircle className="w-5 h-5 text-success" />
        </div>
        
        <div>
          <h4 className="font-semibold text-success">
            쿼리가 성공적으로 실행되었습니다
          </h4>
          <p className="text-sm text-muted-foreground mt-0.5">
            영향받은 행: <strong className="text-foreground">{affectedRows}개</strong>
            <span className="mx-2">•</span>
            실행 시간: <strong className="text-foreground">{executionTime.toFixed(3)}초</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
