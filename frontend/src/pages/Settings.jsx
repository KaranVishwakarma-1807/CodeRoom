import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="panel settings-panel">
          <h2>Appearance Settings</h2>
          <p>Choose your interview workspace theme. Changes apply instantly and are saved for future sessions.</p>
          <div className="theme-grid">
            {themes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`theme-card ${theme === item.id ? "active" : ""}`}
                onClick={() => setTheme(item.id)}
              >
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <span>{theme === item.id ? "Active Theme" : "Set Theme"}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
