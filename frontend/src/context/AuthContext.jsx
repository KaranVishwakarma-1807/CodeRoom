import { createContext, useContext, useMemo, useState } from "react";
import { loginRequest, meRequest, registerRequest } from "../services/auth";

const AuthContext = createContext(null);
const AUTH_BYPASS = String(import.meta.env.VITE_AUTH_BYPASS || "").toLowerCase() === "true";
const BYPASS_USER = {
  id: 0,
  name: import.meta.env.VITE_AUTH_BYPASS_NAME || "Dev User",
  email: import.meta.env.VITE_AUTH_BYPASS_EMAIL || "dev@coderoom.local",
};
const BYPASS_TOKEN = "dev-auth-bypass";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(AUTH_BYPASS ? BYPASS_TOKEN : localStorage.getItem("token"));
  const [user, setUser] = useState(AUTH_BYPASS ? BYPASS_USER : JSON.parse(localStorage.getItem("user") || "null"));

  const saveAuth = (nextToken, nextUser) => {
    if (AUTH_BYPASS) {
      setToken(BYPASS_TOKEN);
      setUser(BYPASS_USER);
      return;
    }
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const login = async (email, password) => {
    if (AUTH_BYPASS) return;
    const res = await loginRequest({ email, password });
    saveAuth(res.access_token, res.user);
  };

  const register = async (name, email, password) => {
    if (AUTH_BYPASS) return;
    await registerRequest({ name, email, password });
    await login(email, password);
  };

  const refreshMe = async () => {
    if (AUTH_BYPASS) return BYPASS_USER;
    if (!token) return null;
    const me = await meRequest();
    setUser(me);
    localStorage.setItem("user", JSON.stringify(me));
    return me;
  };

  const logout = () => {
    if (AUTH_BYPASS) return;
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value = useMemo(() => ({ token, user, login, register, refreshMe, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
