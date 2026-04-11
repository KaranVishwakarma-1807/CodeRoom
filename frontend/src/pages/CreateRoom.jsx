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
      <main className="page">
        <section className="panel">
          <h2>Create Room</h2>
          <form onSubmit={create}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Room title" />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="interviewer">Interviewer</option>
              <option value="candidate">Candidate</option>
            </select>
            <button type="submit">Create</button>
          </form>
          {error ? <p className="error">{error}</p> : null}
        </section>
      </main>
    </>
  );
}
