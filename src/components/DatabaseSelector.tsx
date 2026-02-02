import { ChevronDown } from 'lucide-react';
import { DBMS_CONFIGS, DBMSType } from '@/types/database';
import { useSQLEditorStore } from '@/store/sqlEditorStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function DatabaseSelector() {
  const { selectedDbms, setSelectedDbms, connection } = useSQLEditorStore();
  
  const selectedConfig = DBMS_CONFIGS.find(c => c.id === selectedDbms);
  
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-foreground">
        데이터베이스:
      </label>
      
      <Select
        value={selectedDbms}
        onValueChange={(value) => setSelectedDbms(value as DBMSType)}
        disabled={connection.status === 'connecting'}
      >
        <SelectTrigger className="w-[220px] bg-card">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{selectedConfig?.icon}</span>
              <span>{selectedConfig?.displayName}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-card border border-border shadow-elevated z-50">
          {DBMS_CONFIGS.map((config) => (
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
        </SelectContent>
      </Select>
    </div>
  );
}
