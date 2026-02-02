import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useSQLEditorStore } from '@/store/sqlEditorStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ConnectionManagerModal } from './ConnectionManagerModal';

export function DatabaseSelector() {
  const { userConnections, selectedConnectionId, setSelectedConnection, connection } = useSQLEditorStore();
  const [managerOpen, setManagerOpen] = useState(false);
  
  const selectedConnection = userConnections.find(c => c.id === selectedConnectionId);
  
  return (
    <>
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-foreground">
          데이터베이스:
        </label>
        
        <Select
          value={selectedConnectionId || ''}
          onValueChange={(value) => {
            if (value === '__manage__') {
              setManagerOpen(true);
            } else {
              setSelectedConnection(value);
            }
          }}
          disabled={connection.status === 'connecting'}
        >
          <SelectTrigger className="w-[280px] bg-card">
            <SelectValue placeholder="연결을 선택하세요">
              {selectedConnection && (
                <span className="flex items-center gap-2">
                  <span>{selectedConnection.icon}</span>
                  <span>{selectedConnection.displayName}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-card border border-border shadow-elevated z-50">
            {userConnections.map((config) => (
              <SelectItem 
                key={config.id} 
                value={config.id}
                className="cursor-pointer focus:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{config.icon}</span>
                  <span className="font-medium">{config.displayName}</span>
                  <span className="text-muted-foreground text-xs ml-1">
                    ({config.host}:{config.port})
                  </span>
                </span>
              </SelectItem>
            ))}
            
            <div className="border-t border-border my-1" />
            
            <SelectItem 
              value="__manage__"
              className="cursor-pointer focus:bg-accent"
            >
              <span className="flex items-center gap-2 text-primary">
                <Settings className="w-4 h-4" />
                <span className="font-medium">연결 관리...</span>
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setManagerOpen(true)}
          className="gap-1.5"
        >
          <Settings className="w-4 h-4" />
          관리
        </Button>
      </div>
      
      <ConnectionManagerModal open={managerOpen} onOpenChange={setManagerOpen} />
    </>
  );
}
