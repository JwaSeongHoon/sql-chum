import { Database, User } from 'lucide-react';
import { useSQLEditorStore } from '@/store/sqlEditorStore';

export function Header() {
  const { getSelectedConnection } = useSQLEditorStore();
  const selectedConnection = getSelectedConnection();
  
  return (
    <header className="bg-card border-b border-border px-6 py-4 shadow-soft">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              다중 DBMS SQL 편집기
            </h1>
            <p className="text-xs text-muted-foreground">
              Multi-Database SQL Editor
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span className="font-medium text-foreground">
            {selectedConnection?.username || 'Not connected'}
          </span>
        </div>
      </div>
    </header>
  );
}
