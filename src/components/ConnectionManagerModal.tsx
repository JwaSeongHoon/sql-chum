import { useState } from 'react';
import { Plus, Pencil, Trash2, Download, Upload, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useSQLEditorStore } from '@/store/sqlEditorStore';
import { DBMSConfig, DBMSType, DBMS_TYPE_CONFIGS } from '@/types/database';
import { testConnection } from '@/services/sqlExecutor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ConnectionManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ModalView = 'list' | 'add' | 'edit';

interface ConnectionFormData {
  type: DBMSType;
  displayName: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  description: string;
}

const defaultFormData: ConnectionFormData = {
  type: 'oracle',
  displayName: '',
  host: 'localhost',
  port: 1521,
  database: '',
  username: '',
  password: '',
  description: '',
};

export function ConnectionManagerModal({ open, onOpenChange }: ConnectionManagerModalProps) {
  const { userConnections, addConnection, updateConnection, deleteConnection, exportData, importData } = useSQLEditorStore();
  
  const [view, setView] = useState<ModalView>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ConnectionFormData>(defaultFormData);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<DBMSConfig | null>(null);
  
  const resetForm = () => {
    setFormData(defaultFormData);
    setTestResult(null);
    setEditingId(null);
  };
  
  const handleAddNew = () => {
    resetForm();
    setView('add');
  };
  
  const handleEdit = (connection: DBMSConfig) => {
    setFormData({
      type: connection.type,
      displayName: connection.displayName,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: connection.password,
      description: connection.description || '',
    });
    setEditingId(connection.id);
    setTestResult(null);
    setView('edit');
  };
  
  const handleDelete = (connection: DBMSConfig) => {
    setConnectionToDelete(connection);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (connectionToDelete) {
      deleteConnection(connectionToDelete.id);
      toast.success('연결이 삭제되었습니다.');
    }
    setDeleteDialogOpen(false);
    setConnectionToDelete(null);
  };
  
  const handleTypeChange = (type: DBMSType) => {
    const config = DBMS_TYPE_CONFIGS[type];
    setFormData(prev => ({
      ...prev,
      type,
      port: config.defaultPort,
    }));
  };
  
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await testConnection(formData.type);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: '연결 테스트 중 오류가 발생했습니다.' });
    } finally {
      setTesting(false);
    }
  };
  
  const handleSave = () => {
    const config = DBMS_TYPE_CONFIGS[formData.type];
    
    const connectionData = {
      type: formData.type,
      name: formData.type.charAt(0).toUpperCase() + formData.type.slice(1),
      displayName: formData.displayName || `${formData.type} - ${formData.host}`,
      host: formData.host,
      port: formData.port,
      database: formData.database,
      username: formData.username,
      password: formData.password,
      description: formData.description,
      icon: config.icon,
      color: config.color,
    };
    
    if (editingId) {
      updateConnection(editingId, connectionData);
      toast.success('연결 정보가 수정되었습니다.');
    } else {
      addConnection(connectionData);
      toast.success('새 연결이 추가되었습니다.');
    }
    
    setView('list');
    resetForm();
  };
  
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sql_chum_data_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('설정이 내보내졌습니다.');
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.version || !data.connections) {
          throw new Error('Invalid file format');
        }
        
        importData(data, true); // Merge mode
        toast.success(`${data.connections.length}개의 연결이 가져와졌습니다.`);
      } catch (error) {
        toast.error('파일을 불러오는데 실패했습니다. 올바른 JSON 파일인지 확인해주세요.');
      }
    };
    
    input.click();
  };
  
  const renderList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={handleAddNew} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            새 연결 추가
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImport} className="gap-1.5">
            <Upload className="w-4 h-4" />
            불러오기
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="w-4 h-4" />
            내보내기
          </Button>
        </div>
      </div>
      
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">유형</TableHead>
              <TableHead>연결 이름</TableHead>
              <TableHead>호스트</TableHead>
              <TableHead>사용자</TableHead>
              <TableHead className="w-[100px] text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userConnections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  등록된 연결이 없습니다. 새 연결을 추가해주세요.
                </TableCell>
              </TableRow>
            ) : (
              userConnections.map((conn) => (
                <TableRow key={conn.id}>
                  <TableCell>
                    <span className="text-lg">{conn.icon}</span>
                  </TableCell>
                  <TableCell className="font-medium">{conn.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {conn.host}:{conn.port}/{conn.database}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{conn.username}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(conn)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(conn)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
        <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
        <p className="text-muted-foreground">
          <span className="font-medium text-warning">주의:</span> 내보내기 파일에는 비밀번호가 포함됩니다. 파일을 안전하게 보관하세요.
        </p>
      </div>
    </div>
  );
  
  const renderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">DBMS 유형</Label>
          <Select value={formData.type} onValueChange={(v) => handleTypeChange(v as DBMSType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DBMS_TYPE_CONFIGS).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  <span className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span>{type.toUpperCase()}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="displayName">연결 이름</Label>
          <Input
            id="displayName"
            placeholder="My Oracle DB"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="host">호스트</Label>
          <Input
            id="host"
            placeholder="localhost"
            value={formData.host}
            onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="port">포트</Label>
          <Input
            id="port"
            type="number"
            value={formData.port}
            onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="database">데이터베이스/SID</Label>
        <Input
          id="database"
          placeholder="XE"
          value={formData.database}
          onChange={(e) => setFormData(prev => ({ ...prev, database: e.target.value }))}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">사용자명</Label>
          <Input
            id="username"
            placeholder="scott"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">설명 (선택)</Label>
        <Input
          id="description"
          placeholder="개발 서버 Oracle DB"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestConnection}
          disabled={testing || !formData.host}
          className="gap-1.5"
        >
          {testing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          연결 테스트
        </Button>
        
        {testResult && (
          <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-success' : 'text-destructive'}`}>
            {testResult.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {testResult.message}
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => { setView('list'); resetForm(); }}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={!formData.host || !formData.database || !formData.username}>
          {editingId ? '수정' : '추가'}
        </Button>
      </div>
    </div>
  );
  
  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setView('list'); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {view === 'list' && '연결 관리'}
              {view === 'add' && '새 연결 추가'}
              {view === 'edit' && '연결 수정'}
            </DialogTitle>
            <DialogDescription>
              {view === 'list' && '데이터베이스 연결을 관리하고, 설정을 내보내거나 불러올 수 있습니다.'}
              {view === 'add' && '새로운 데이터베이스 연결 정보를 입력하세요.'}
              {view === 'edit' && '연결 정보를 수정하세요.'}
            </DialogDescription>
          </DialogHeader>
          
          {view === 'list' ? renderList() : renderForm()}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>연결 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{connectionToDelete?.displayName}" 연결을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
