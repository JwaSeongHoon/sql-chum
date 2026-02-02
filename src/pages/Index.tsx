import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { DatabaseSelector } from '@/components/DatabaseSelector';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { SqlEditor } from '@/components/SqlEditor';
import { ActionButtons } from '@/components/ActionButtons';
import { ResultsPanel } from '@/components/ResultsPanel';
import { useSQLEditorStore } from '@/store/sqlEditorStore';

const Index = () => {
  const { connect, connection } = useSQLEditorStore();
  
  // Auto-connect on mount
  useEffect(() => {
    if (connection.status === 'disconnected') {
      connect();
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">
        <div className="space-y-4">
          {/* Connection bar */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-soft animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <DatabaseSelector />
              <div className="hidden sm:block w-px h-6 bg-border" />
              <ConnectionStatus />
            </div>
          </div>
          
          {/* SQL Editor */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <SqlEditor />
          </div>
          
          {/* Action buttons */}
          <div className="bg-card rounded-xl border border-border px-4 shadow-soft animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <ActionButtons />
          </div>
          
          {/* Results */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <ResultsPanel />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-card py-3 px-6 text-center text-sm text-muted-foreground">
        <p>
          다중 DBMS SQL 편집기 • Mock 데이터로 동작합니다 • 
          <span className="ml-1">
            지원 테이블: <code className="text-primary">emp</code>, <code className="text-primary">dept</code>, <code className="text-primary">salgrade</code>
          </span>
        </p>
      </footer>
    </div>
  );
};

export default Index;
