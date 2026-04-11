export default function ScorecardPanel({ feedbackEntries }) {
  return (
    <section className="panel scorecard-panel">
      <h3>Candidate Scorecard</h3>
      {feedbackEntries.length === 0 ? <p>No scorecards submitted yet.</p> : null}
      {feedbackEntries.map((entry) => (
        <article key={entry.id} className="scorecard-item">
          <div className="row spread">
            <strong>Overall: {entry.overall_score}/10</strong>
            <span>{entry.recommendation}</span>
          </div>
          <p>Communication: {entry.communication_score}/10</p>
          <p>Problem Solving: {entry.problem_solving_score}/10</p>
          <p>Coding: {entry.coding_score}/10</p>
          <p>Summary: {entry.summary || "N/A"}</p>
          <p>Strengths: {entry.strengths || "N/A"}</p>
          <p>Improvements: {entry.improvements || "N/A"}</p>
        </article>
      ))}
    </section>
  );
}
