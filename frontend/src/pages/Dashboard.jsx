import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [role, setRole] = useState("candidate");
  const [error, setError] = useState("");

  const joinRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post("/rooms/join", { room_code: roomCode, role });
      navigate(`/rooms/${roomCode}`);
    } catch {
      setError("Unable to join room");
    }
  };

  return (
    <>
      <Navbar />
      <main className="page app-shell">
        <section className="page-head">
          <h2>Interview Workspace</h2>
          <p>Create a room or join one with a code to start live collaboration.</p>
        </section>
        <section className="dashboard-grid">
          <article className="panel">
            <h3>Join Room</h3>
            <p>Enter a room code shared by the interviewer to join instantly.</p>
            <form className="stack-form" onSubmit={joinRoom}>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Room code (e.g., AB12CD)"
              />
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="candidate">Candidate</option>
                <option value="interviewer">Interviewer</option>
              </select>
              <button type="submit">Join Room</button>
            </form>
            {error ? <p className="error">{error}</p> : null}
          </article>
          <article className="panel">
            <h3>Quick Start</h3>
            <p>New interview? Spin up a dedicated room with timer, editor, chat, and call controls.</p>
            <button type="button" onClick={() => navigate("/rooms/create")}>
              Create New Room
            </button>
          </article>
        </section>
      </main>
    </>
  );
}
