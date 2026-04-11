import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, language, onCodeChange, onLanguageChange, onRun }) {
  const monacoLanguage = language === "cpp" ? "cpp" : language;

  return (
    <section className="panel editor-panel">
      <div className="row spread">
        <h3>Code Editor</h3>
        <div className="row">
          <select value={language} onChange={(e) => onLanguageChange(e.target.value)}>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button onClick={onRun}>Run</button>
        </div>
      </div>
      <div className="editor-shell">
        <Editor
          height="380px"
          language={monacoLanguage}
          value={code}
          onChange={(value) => onCodeChange(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </section>
  );
}
