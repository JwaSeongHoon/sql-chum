import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DBMSType, ConnectionState, DBMS_CONFIGS } from '@/types/database';
import { QueryResult, QueryHistoryItem } from '@/types/query';
import { testConnection, executeQuery } from '@/services/sqlExecutor';

interface SQLEditorState {
  // Connection
  selectedDbms: DBMSType;
  connection: ConnectionState;
  
  // Editor
  sql: string;
  
  // Execution
  isExecuting: boolean;
  result: QueryResult | null;
  
  // History
  history: QueryHistoryItem[];
  
  // Actions
  setSelectedDbms: (dbms: DBMSType) => void;
  setSql: (sql: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  execute: () => Promise<void>;
  clearEditor: () => void;
  clearResult: () => void;
  addToHistory: (item: Omit<QueryHistoryItem, 'id' | 'timestamp'>) => void;
  loadFromHistory: (item: QueryHistoryItem) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_ITEMS = 10;

export const useSQLEditorStore = create<SQLEditorState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedDbms: 'oracle',
      connection: {
        status: 'disconnected',
        dbms: null,
      },
      sql: 'SELECT * FROM emp;',
      isExecuting: false,
      result: null,
      history: [],
      
      // Actions
      setSelectedDbms: (dbms) => {
        set({ selectedDbms: dbms });
        // Auto-connect when changing DBMS
        get().connect();
      },
      
      setSql: (sql) => set({ sql }),
      
      connect: async () => {
        const { selectedDbms } = get();
        
        set({
          connection: {
            status: 'connecting',
            dbms: selectedDbms,
          },
        });
        
        const result = await testConnection(selectedDbms);
        
        if (result.success) {
          set({
            connection: {
              status: 'connected',
              dbms: selectedDbms,
              message: result.message,
              serverVersion: result.version,
            },
          });
        } else {
          set({
            connection: {
              status: 'error',
              dbms: selectedDbms,
              message: result.message,
            },
          });
        }
      },
      
      disconnect: () => {
        set({
          connection: {
            status: 'disconnected',
            dbms: null,
          },
        });
      },
      
      execute: async () => {
        const { sql, selectedDbms, connection } = get();
        
        if (!sql.trim() || connection.status !== 'connected') {
          return;
        }
        
        set({ isExecuting: true, result: null });
        
        const result = await executeQuery(sql, selectedDbms);
        
        set({ result, isExecuting: false });
        
        // Add to history
        get().addToHistory({
          sql,
          dbms: selectedDbms,
          success: result.success,
          executionTime: result.data?.executionTime || result.executionTime,
          rowCount: result.data?.rowCount,
          error: result.error?.message,
        });
      },
      
      clearEditor: () => set({ sql: '' }),
      
      clearResult: () => set({ result: null }),
      
      addToHistory: (item) => {
        const { history } = get();
        const newItem: QueryHistoryItem = {
          ...item,
          id: Date.now().toString(),
          timestamp: new Date(),
        };
        
        const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
        set({ history: updatedHistory });
      },
      
      loadFromHistory: (item) => {
        set({ sql: item.sql });
        if (item.dbms !== get().selectedDbms) {
          get().setSelectedDbms(item.dbms as DBMSType);
        }
      },
      
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'sql-editor-storage',
      partialize: (state) => ({
        history: state.history,
        selectedDbms: state.selectedDbms,
      }),
    }
  )
);
