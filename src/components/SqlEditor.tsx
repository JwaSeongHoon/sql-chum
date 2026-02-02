import { useRef, useCallback } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import { useSQLEditorStore } from '@/store/sqlEditorStore';
import { formatSQL } from '@/services/sqlFormatter';

type MonacoEditor = Parameters<OnMount>[0];

const PLACEHOLDER = `-- 여기에 SQL 쿼리를 작성하세요
-- 팁: Ctrl + Enter를 눌러 실행하세요
-- 예제: SELECT * FROM emp WHERE deptno = 10;

SELECT * FROM emp;`;

export function SqlEditor() {
  const editorRef = useRef<MonacoEditor | null>(null);
  const { sql, setSql, execute, connection, selectedDbms, clearEditor } = useSQLEditorStore();
  
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    
    // Register keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (connection.status === 'connected') {
        execute();
      }
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      const currentValue = editor.getValue();
      const formatted = formatSQL(currentValue, selectedDbms);
      editor.setValue(formatted);
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {
      clearEditor();
    });
    
    // Focus editor
    editor.focus();
  }, [connection.status, execute, selectedDbms, clearEditor]);
  
  const handleBeforeMount = useCallback((monaco: Monaco) => {
    // Define custom SQL theme
    monaco.editor.defineTheme('sql-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'operator', foreground: 'd4d4d4' },
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#cdd6f4',
        'editor.lineHighlightBackground': '#313244',
        'editorLineNumber.foreground': '#6c7086',
        'editorLineNumber.activeForeground': '#cdd6f4',
        'editor.selectionBackground': '#45475a',
        'editorCursor.foreground': '#f5e0dc',
      },
    });
  }, []);
  
  return (
    <div className="editor-container h-[300px]">
      <Editor
        height="100%"
        defaultLanguage="sql"
        value={sql || PLACEHOLDER}
        onChange={(value) => setSql(value || '')}
        onMount={handleEditorDidMount}
        beforeMount={handleBeforeMount}
        theme="sql-dark"
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
        }}
      />
    </div>
  );
}
