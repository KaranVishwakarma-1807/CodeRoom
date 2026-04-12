import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string" && detail.trim()) {
        setError(detail);
      } else {
        setError("Login failed. Please check your email and password.");
      }
    }
  };

  return (
    <main className="auth-page">
      <form className="panel auth-form" onSubmit={submit}>
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue your interview sessions.</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        <button type="submit">Login</button>
        {error ? <p className="error">{error}</p> : null}
        <p>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </main>
  );
}
