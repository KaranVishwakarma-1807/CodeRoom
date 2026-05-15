export default function OutputConsole({ output, error }) {
  return (
    <div className="output-panel">
      <div className="panel-header">Output Console</div>
      <div className={`output-content ${error ? "error" : ""}`}>
        {error || output || "Run code to see output."}
      </div>
    </div>
  );
}
