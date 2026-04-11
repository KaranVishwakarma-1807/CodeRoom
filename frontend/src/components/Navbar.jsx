import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <h1>CodeRoom</h1>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/rooms/create">Create Room</Link>
      </nav>
      <div>
        <span>{user?.name || "Guest"}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
