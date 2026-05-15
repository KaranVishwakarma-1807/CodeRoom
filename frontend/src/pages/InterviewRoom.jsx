import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChatPanel from "../components/ChatPanel";
import CodeEditor from "../components/CodeEditor";
import FeedbackPanel from "../components/FeedbackPanel";
import OutputConsole from "../components/OutputConsole";
import ParticipantList from "../components/ParticipantList";
import ScorecardPanel from "../components/ScorecardPanel";
import Timer from "../components/Timer";
import VideoPanel from "../components/VideoPanel";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import api from "../services/api";
import {
  createSessionFeedback,
  endSession,
  getSessionFeedback,
  getSessionHistory,
  startSession,
} from "../services/sessions";

export default function InterviewRoom() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [code, setCode] = useState("// Start coding here");
  const [language, setLanguage] = useState("python");
  const [timerSeconds, setTimerSeconds] = useState(1800);
  const [timerRunning, setTimerRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [roomTitle, setRoomTitle] = useState(`Room ${roomCode}`);
  const [statusMessage, setStatusMessage] = useState("Connecting...");
  const [history, setHistory] = useState([]);
  const [feedbackEntries, setFeedbackEntries] = useState([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);

  const onEvent = useCallback((event) => {
    if (event.type === "chat_message") {
      setMessages((prev) => [...prev, { user: event.user, message: event.payload.message }]);
    }
    if (event.type === "code_update") {
      setCode(event.payload.code || "");
      setLanguage(event.payload.language || "python");
    }
    if (event.type === "code_state") {
      setCode(event.payload.code || "");
      setLanguage(event.payload.language || "python");
    }
    if (event.type === "code_output") {
      setOutput(event.payload.output || "");
      setError(event.payload.error || "");
    }
    if (event.type === "participant_joined") {
      setStatusMessage(`${event.payload.name} joined`);
    }
    if (event.type === "participant_left") {
      setStatusMessage(`${event.payload.name} left`);
    }
    if (event.type === "presence_state") {
      setParticipants(event.payload.participants || []);
    }
    if (event.type === "timer_start" || event.type === "timer_pause" || event.type === "timer_reset" || event.type === "timer_state") {
      setTimerRunning(Boolean(event.payload.timer?.running));
      setTimerSeconds(event.payload.timer?.seconds ?? 0);
    }
  }, []);

  const { connected, send } = useWebSocket(roomCode, token, onEvent);

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const roomRes = await api.get(`/rooms/${roomCode}`);
        setRoomTitle(roomRes.data.title);

        const [participantsRes, historyRes, feedbackRes] = await Promise.all([
          api.get(`/rooms/${roomCode}/participants`),
          getSessionHistory(roomCode),
          getSessionFeedback(roomCode),
        ]);
        setParticipants(participantsRes.data.map((row) => ({ user_id: row.user_id, name: row.name, role: row.role })));
        setHistory(historyRes);
        setFeedbackEntries(feedbackRes);
      } catch {
        setError("Room unavailable or expired");
      }
    };
    loadRoomData();
  }, [roomCode]);

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setTimerSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timerRunning, timerSeconds]);

  useEffect(() => {
    setStatusMessage(connected ? "Connected" : "Connecting...");
  }, [connected]);

  const sendChat = (message) => {
    send({ type: "chat_message", room_code: roomCode, payload: { message } });
  };

  const updateCode = (nextCode) => {
    setCode(nextCode);
    send({ type: "code_update", room_code: roomCode, payload: { code: nextCode, language } });
  };

  const updateLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    send({ type: "code_update", room_code: roomCode, payload: { code, language: nextLanguage } });
  };

  const runCode = async () => {
    setError("");
    send({ type: "run_code", room_code: roomCode, payload: { language, code, stdin: "" } });
  };

  const refreshSessionData = async () => {
    const [historyRes, feedbackRes] = await Promise.all([
      getSessionHistory(roomCode),
      getSessionFeedback(roomCode),
    ]);
    setHistory(historyRes);
    setFeedbackEntries(feedbackRes);
  };

  const handleStartSession = async () => {
    setSessionBusy(true);
    setError("");
    try {
      await startSession(roomCode, language);
      await refreshSessionData();
      setStatusMessage("Session started");
    } catch {
      setError("Only interviewer can start session");
    } finally {
      setSessionBusy(false);
    }
  };

  const handleEndSession = async () => {
    setSessionBusy(true);
    setError("");
    try {
      await endSession(roomCode);
      await refreshSessionData();
      setStatusMessage("Session ended and history saved");
    } catch {
      setError("Only interviewer can end session");
    } finally {
      setSessionBusy(false);
    }
  };

  const handleSubmitFeedback = async (payload) => {
    setSubmittingFeedback(true);
    setError("");
    try {
      await createSessionFeedback(roomCode, payload);
      await refreshSessionData();
      setStatusMessage("Feedback saved");
    } catch {
      setError("Unable to save feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const myRole = participants.find((p) => p.user_id === user?.id)?.role;
  const isInterviewer = myRole === "interviewer";

  const startTimer = () => send({ type: "timer_start", room_code: roomCode, payload: { seconds: timerSeconds } });
  const pauseTimerAction = () => send({ type: "timer_pause", room_code: roomCode, payload: {} });
  const resetTimerAction = () => send({ type: "timer_reset", room_code: roomCode, payload: { seconds: 1800 } });

  return (
    <main className="room-page app-shell">
      <header className="room-header panel">
        <div className="room-title">
          <h2>{roomTitle}</h2>
          {statusMessage && <span className="status">{statusMessage}</span>}
        </div>
        <div className="room-toolbar">
          <Timer
            seconds={timerSeconds}
            isRunning={timerRunning}
            onStart={startTimer}
            onPause={pauseTimerAction}
            onReset={resetTimerAction}
          />
          <ParticipantList participants={participants} />
          <button className="primary" onClick={handleStartSession} disabled={sessionBusy || !isInterviewer}>Start Session</button>
          <button onClick={handleEndSession} disabled={sessionBusy || !isInterviewer}>End</button>
          <button onClick={() => navigate("/dashboard")}>Leave</button>
        </div>
      </header>

      <section className="room-main">
        <div className="left-pane animate-fade">
          <div className="side-panel">
            <VideoPanel roomCode={roomCode} userName={user?.name || "Guest"} />
          </div>
          
          <ChatPanel messages={messages} onSend={sendChat} />
          
          <div className="side-panel">
            <ScorecardPanel feedbackEntries={feedbackEntries} />
          </div>
          
          {isInterviewer ? (
            <div className="side-panel">
              <FeedbackPanel
                participants={participants}
                onSubmit={handleSubmitFeedback}
                submitting={submittingFeedback}
              />
            </div>
          ) : null}
          
          <section className="side-panel history-panel">
            <h3>Interview History</h3>
            {history.length === 0 ? <p>No sessions yet.</p> : null}
            {history.map((row) => (
              <article key={row.id} className="history-item">
                <div className="row spread">
                  <strong>Session #{row.id}</strong>
                  <span>{row.status}</span>
                </div>
                <p>Language: {row.language}</p>
                <p>Chat Messages: {row.chat_count}</p>
                <p>Latest Code Snapshot: {row.latest_code_language || "N/A"}</p>
                <p>Overall Score: {row.overall_score ?? "N/A"}</p>
              </article>
            ))}
          </section>
        </div>

        <div className="right-pane animate-fade" style={{ animationDelay: "0.1s" }}>
          <CodeEditor
            code={code}
            language={language}
            onCodeChange={updateCode}
            onLanguageChange={updateLanguage}
            onRun={runCode}
          />
          <OutputConsole output={output} error={error} />
        </div>
      </section>
    </main>
  );
}
