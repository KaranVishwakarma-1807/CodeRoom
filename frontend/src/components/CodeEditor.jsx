import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, language, onCodeChange, onLanguageChange, onRun }) {
  const monacoLanguage = language === "cpp" ? "cpp" : language;

  return (
    <div className="editor-panel">
      <div className="panel-header">
        <select value={language} onChange={(e) => onLanguageChange(e.target.value)}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <button className="primary" onClick={onRun}>Run Code</button>
      </div>
      <div className="editor-shell">
        <Editor
          height="100%"
          language={monacoLanguage}
          theme="vs-dark"
          value={code}
          onChange={(value) => onCodeChange(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            lineHeight: 24,
          }}
        />
      </div>
    </div>
  );
}
