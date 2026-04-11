export default function OutputConsole({ output, error }) {
  return (
    <section className="panel output-panel">
      <h3>Output Console</h3>
      <pre>{output || "Run code to see output."}</pre>
      {error ? <pre className="error">{error}</pre> : null}
    </section>
  );
}
