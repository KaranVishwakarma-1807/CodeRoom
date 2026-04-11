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
      <main className="page">
        <section className="panel">
          <h2>Join Room</h2>
          <form onSubmit={joinRoom}>
            <input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="candidate">Candidate</option>
              <option value="interviewer">Interviewer</option>
            </select>
            <button type="submit">Join</button>
          </form>
          {error ? <p className="error">{error}</p> : null}
        </section>
      </main>
    </>
  );
}
