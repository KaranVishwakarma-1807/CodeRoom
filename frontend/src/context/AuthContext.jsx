import { createContext, useContext, useMemo, useState } from "react";
import { loginRequest, meRequest, registerRequest } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  const saveAuth = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const login = async (email, password) => {
    const res = await loginRequest({ email, password });
    saveAuth(res.access_token, res.user);
  };

  const register = async (name, email, password) => {
    await registerRequest({ name, email, password });
    await login(email, password);
  };

  const refreshMe = async () => {
    if (!token) return null;
    const me = await meRequest();
    setUser(me);
    localStorage.setItem("user", JSON.stringify(me));
    return me;
  };

  const logout = () => {
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
