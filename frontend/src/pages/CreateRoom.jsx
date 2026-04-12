import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function CreateRoom() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Live Interview");
  const [role, setRole] = useState("interviewer");
  const [error, setError] = useState("");

  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/rooms/create", { title, role });
      navigate(`/rooms/${data.room_code}`);
    } catch {
      setError("Failed to create room");
    }
  };

  return (
    <>
      <Navbar />
      <main className="page app-shell">
        <section className="page-head">
          <h2>Create Interview Room</h2>
          <p>Configure your room and start interviewing in seconds.</p>
        </section>
        <section className="dashboard-grid">
          <article className="panel">
            <h3>Room Details</h3>
            <form className="stack-form" onSubmit={create}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Room title" />
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="interviewer">Interviewer</option>
                <option value="candidate">Candidate</option>
              </select>
              <button type="submit">Create Room</button>
            </form>
            {error ? <p className="error">{error}</p> : null}
          </article>
          <article className="panel">
            <h3>What You Get</h3>
            <ul className="feature-list">
              <li>Realtime code collaboration</li>
              <li>Integrated chat and interview timer</li>
              <li>Language execution with output console</li>
              <li>Video call panel and scorecard workflow</li>
            </ul>
          </article>
        </section>
      </main>
    </>
  );
}
