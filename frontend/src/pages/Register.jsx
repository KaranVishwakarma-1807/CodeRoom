import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string" && detail.trim()) {
        setError(detail);
      } else {
        setError("Registration failed. Please verify your inputs.");
      }
    }
  };

  return (
    <main className="auth-page">
      <form className="panel auth-form" onSubmit={submit}>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Set up your profile to host or join live coding interviews.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        <button type="submit">Create account</button>
        {error ? <p className="error">{error}</p> : null}
        <p>
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
