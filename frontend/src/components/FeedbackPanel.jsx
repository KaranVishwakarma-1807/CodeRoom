import { useMemo, useState } from "react";

const defaultForm = {
  candidate_id: "",
  summary: "",
  strengths: "",
  improvements: "",
  recommendation: "hold",
  communication_score: 7,
  problem_solving_score: 7,
  coding_score: 7,
};

export default function FeedbackPanel({ participants, onSubmit, submitting }) {
  const [form, setForm] = useState(defaultForm);

  const candidates = useMemo(
    () => participants.filter((p) => p.role === "candidate"),
    [participants],
  );

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    await onSubmit({
      ...form,
      candidate_id: form.candidate_id ? Number(form.candidate_id) : null,
      communication_score: Number(form.communication_score),
      problem_solving_score: Number(form.problem_solving_score),
      coding_score: Number(form.coding_score),
    });
    setForm(defaultForm);
  };

  return (
    <section className="panel feedback-panel">
      <h3>Interviewer Feedback</h3>
      <form onSubmit={submit} className="feedback-form">
        <select value={form.candidate_id} onChange={(e) => setField("candidate_id", e.target.value)}>
          <option value="">Select candidate</option>
          {candidates.map((c) => (
            <option key={c.user_id} value={c.user_id}>
              {c.name}
            </option>
          ))}
        </select>

        <textarea
          value={form.summary}
          onChange={(e) => setField("summary", e.target.value)}
          placeholder="Overall summary"
        />
        <textarea
          value={form.strengths}
          onChange={(e) => setField("strengths", e.target.value)}
          placeholder="Strengths"
        />
        <textarea
          value={form.improvements}
          onChange={(e) => setField("improvements", e.target.value)}
          placeholder="Improvements"
        />

        <div className="feedback-grid">
          <label>
            Communication (0-10)
            <input
              type="number"
              min="0"
              max="10"
              value={form.communication_score}
              onChange={(e) => setField("communication_score", e.target.value)}
            />
          </label>
          <label>
            Problem Solving (0-10)
            <input
              type="number"
              min="0"
              max="10"
              value={form.problem_solving_score}
              onChange={(e) => setField("problem_solving_score", e.target.value)}
            />
          </label>
          <label>
            Coding (0-10)
            <input
              type="number"
              min="0"
              max="10"
              value={form.coding_score}
              onChange={(e) => setField("coding_score", e.target.value)}
            />
          </label>
        </div>

        <select value={form.recommendation} onChange={(e) => setField("recommendation", e.target.value)}>
          <option value="strong_hire">Strong Hire</option>
          <option value="hire">Hire</option>
          <option value="hold">Hold</option>
          <option value="no_hire">No Hire</option>
        </select>

        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Feedback"}
        </button>
      </form>
    </section>
  );
}
