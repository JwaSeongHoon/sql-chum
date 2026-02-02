import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DBMSConfig, ConnectionState, DEFAULT_CONNECTIONS, DBMS_TYPE_CONFIGS } from '@/types/database';
import { QueryResult, QueryHistoryItem } from '@/types/query';
import { testConnection, executeQuery, checkProxyHealth } from '@/services/sqlExecutor';

interface SQLEditorState {
  // Proxy Settings
  proxyUrl: string;
  proxyConnected: boolean;
  proxyMessage: string;
  
  // Connections
  userConnections: DBMSConfig[];
  selectedConnectionId: string | null;
  connection: ConnectionState;
  
  // Editor
  sql: string;
  
  // Execution
  isExecuting: boolean;
  result: QueryResult | null;
  
  // History
  history: QueryHistoryItem[];
  
  // Proxy Actions
  setProxyUrl: (url: string) => void;
  checkProxy: () => Promise<void>;
  
  // Connection CRUD Actions
  addConnection: (connection: Omit<DBMSConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateConnection: (id: string, updates: Partial<DBMSConfig>) => void;
  deleteConnection: (id: string) => void;
  setSelectedConnection: (id: string) => void;
  getSelectedConnection: () => DBMSConfig | null;
  
  // Import/Export
  exportData: () => ExportData;
  importData: (data: ExportData, merge?: boolean) => void;
  
  // Editor Actions
  setSql: (sql: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  execute: () => Promise<void>;
  clearEditor: () => void;
  clearResult: () => void;
  
  // History Actions
  addToHistory: (item: Omit<QueryHistoryItem, 'id' | 'timestamp'>) => void;
  loadFromHistory: (item: QueryHistoryItem) => void;
  clearHistory: () => void;
}

interface ExportData {
  version: string;
  exportedAt: string;
  connections: DBMSConfig[];
  history: QueryHistoryItem[];
}

const MAX_HISTORY_ITEMS = 100;

const generateId = () => `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useSQLEditorStore = create<SQLEditorState>()(
  persist(
    (set, get) => ({
      // Initial state - Proxy
      proxyUrl: 'http://localhost:3001',
      proxyConnected: false,
      proxyMessage: '프록시 서버 상태를 확인하세요',
      
      // Initial state - Connections
      userConnections: [],
      selectedConnectionId: null,
      connection: {
        status: 'disconnected',
        connectionId: null,
      },
      sql: 'SELECT * FROM emp;',
      isExecuting: false,
      result: null,
      history: [],
      
      // Proxy Actions
      setProxyUrl: (url) => set({ proxyUrl: url }),
      
      checkProxy: async () => {
        const result = await checkProxyHealth();
        set({
          proxyConnected: result.connected,
          proxyMessage: result.message,
        });
      },
      
      // Connection CRUD
      addConnection: (connectionData) => {
        const newConnection: DBMSConfig = {
          ...connectionData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          userConnections: [...state.userConnections, newConnection],
        }));
        
        return newConnection;
      },
      
      updateConnection: (id, updates) => {
        set((state) => ({
          userConnections: state.userConnections.map((conn) =>
            conn.id === id
              ? { ...conn, ...updates, updatedAt: new Date() }
              : conn
          ),
        }));
      },
      
      deleteConnection: (id) => {
        const { selectedConnectionId } = get();
        
        set((state) => ({
          userConnections: state.userConnections.filter((conn) => conn.id !== id),
          selectedConnectionId: selectedConnectionId === id ? null : selectedConnectionId,
          connection: selectedConnectionId === id 
            ? { status: 'disconnected', connectionId: null }
            : state.connection,
        }));
      },
      
      setSelectedConnection: (id) => {
        set({ selectedConnectionId: id });
        get().connect();
      },
      
      getSelectedConnection: () => {
        const { userConnections, selectedConnectionId } = get();
        return userConnections.find((c) => c.id === selectedConnectionId) || null;
      },
      
      // Import/Export
      exportData: () => {
        const { userConnections, history } = get();
        return {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          connections: userConnections,
          history,
        };
      },
      
      importData: (data, merge = false) => {
        if (merge) {
          set((state) => {
            const existingIds = new Set(state.userConnections.map((c) => c.id));
            const newConnections = data.connections.filter((c) => !existingIds.has(c.id));
            
            const existingHistoryIds = new Set(state.history.map((h) => h.id));
            const newHistory = data.history.filter((h) => !existingHistoryIds.has(h.id));
            
            return {
              userConnections: [...state.userConnections, ...newConnections],
              history: [...newHistory, ...state.history].slice(0, MAX_HISTORY_ITEMS),
            };
          });
        } else {
          set({
            userConnections: data.connections,
            history: data.history.slice(0, MAX_HISTORY_ITEMS),
            selectedConnectionId: null,
            connection: { status: 'disconnected', connectionId: null },
          });
        }
      },
      
      // Editor Actions
      setSql: (sql) => set({ sql }),
      
      connect: async () => {
        const { selectedConnectionId, userConnections } = get();
        const selectedConnection = userConnections.find((c) => c.id === selectedConnectionId);
        
        if (!selectedConnection) {
          set({
            connection: {
              status: 'disconnected',
              connectionId: null,
            },
          });
          return;
        }
        
        set({
          connection: {
            status: 'connecting',
            connectionId: selectedConnectionId,
          },
        });
        
        const result = await testConnection(selectedConnection);
        
        if (result.success) {
          set({
            connection: {
              status: 'connected',
              connectionId: selectedConnectionId,
              message: result.message,
              serverVersion: result.version,
            },
          });
        } else {
          set({
            connection: {
              status: 'error',
              connectionId: selectedConnectionId,
              message: result.message,
            },
          });
        }
      },
      
      disconnect: () => {
        set({
          connection: {
            status: 'disconnected',
            connectionId: null,
          },
        });
      },
      
      execute: async () => {
        const { sql, selectedConnectionId, userConnections, connection } = get();
        const selectedConnection = userConnections.find((c) => c.id === selectedConnectionId);
        
        if (!sql.trim() || connection.status !== 'connected' || !selectedConnection) {
          return;
        }
        
        set({ isExecuting: true, result: null });
        
        const result = await executeQuery(sql, selectedConnection);
        
        set({ result, isExecuting: false });
        
        // Add to history
        get().addToHistory({
          sql,
          dbms: selectedConnection.type,
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
        const { userConnections } = get();
        set({ sql: item.sql });
        
        // Find connection with matching dbms type
        const matchingConnection = userConnections.find((c) => c.type === item.dbms);
        if (matchingConnection) {
          get().setSelectedConnection(matchingConnection.id);
        }
      },
      
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'sql-editor-storage',
      partialize: (state) => ({
        proxyUrl: state.proxyUrl,
        userConnections: state.userConnections,
        history: state.history,
        selectedConnectionId: state.selectedConnectionId,
        sql: state.sql,
      }),
    }
  )
);

// Initialize store with default data if empty
setTimeout(() => {
  const state = useSQLEditorStore.getState();
  if (state.userConnections.length === 0) {
    useSQLEditorStore.setState({
      userConnections: DEFAULT_CONNECTIONS.map(conn => ({
        ...conn,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      selectedConnectionId: DEFAULT_CONNECTIONS[0].id,
    });
  } else {
    // Convert date strings back to Date objects for rehydrated data
    const fixedConnections = state.userConnections.map((conn: any) => ({
      ...conn,
      createdAt: new Date(conn.createdAt),
      updatedAt: new Date(conn.updatedAt),
    }));
    const fixedHistory = state.history.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
    useSQLEditorStore.setState({
      userConnections: fixedConnections,
      history: fixedHistory,
    });
  }
}, 0);
