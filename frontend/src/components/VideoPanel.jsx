import { useEffect, useRef, useState } from "react";
import { getVideoCredentials } from "../services/video";

let sdkLoadPromise;

function loadMeteredSdk(sdkUrl) {
  if (window.MeteredFrame) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-metered-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Metered SDK")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = sdkUrl;
    script.async = true;
    script.dataset.meteredSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Metered SDK"));
    document.body.appendChild(script);
  });
  return sdkLoadPromise;
}

export default function VideoPanel({ roomCode, userName }) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const [status, setStatus] = useState("Loading call...");
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [cameraOn, setCameraOn] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [layoutMode, setLayoutMode] = useState("focus");

  const syncParticipants = (next) => {
    const list = Array.isArray(next) ? next : [];
    setParticipants(list.map((p) => ({ id: p._id || p.meetingSessionId || p.name, name: p.name || "Guest" })));
  };

  const callFrameMethod = async (candidates) => {
    const frame = frameRef.current;
    if (!frame) throw new Error("Video frame is not ready");
    const methodName = candidates.find((name) => typeof frame[name] === "function");
    if (!methodName) throw new Error("Control not supported by current Metered Embed SDK");
    return frame[methodName]();
  };

  const toggleCamera = async () => {
    try {
      if (cameraOn) {
        await callFrameMethod(["stopCamera"]);
      } else {
        await callFrameMethod(["startCamera"]);
      }
      setCameraOn((prev) => !prev);
      setError("");
    } catch (err) {
      setError(err.message || "Camera toggle failed");
    }
  };

  const toggleMic = async () => {
    try {
      if (micMuted) {
        await callFrameMethod(["startAudio", "unmuteLocalAudio", "unMuteLocalAudio"]);
      } else {
        await callFrameMethod(["stopAudio", "muteLocalAudio"]);
      }
      setMicMuted((prev) => !prev);
      setError("");
    } catch (err) {
      setError(err.message || "Mic toggle failed");
    }
  };

  const toggleChat = async () => {
    try {
      await callFrameMethod(["openChat"]);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to open chat");
    }
  };

  useEffect(() => {
    let active = true;

    const mountCall = async () => {
      try {
        setError("");
        setStatus("Requesting secure call access...");
        const creds = await getVideoCredentials(roomCode);

        setStatus("Loading video engine...");
        await loadMeteredSdk(creds.sdk_url);
        if (!active || !containerRef.current || !window.MeteredFrame) return;

        setStatus("Joining call...");
        const frame = new window.MeteredFrame();
        frameRef.current = frame;
        if (typeof frame.on === "function") {
          frame.on("onlineParticipants", (list) => {
            if (!active) return;
            syncParticipants(list);
          });
          frame.on("participantJoined", () => {
            if (!active || typeof frame.getOnlineParticipants !== "function") return;
            syncParticipants(frame.getOnlineParticipants());
          });
          frame.on("participantLeft", () => {
            if (!active || typeof frame.getOnlineParticipants !== "function") return;
            syncParticipants(frame.getOnlineParticipants());
          });
          frame.on("meetingJoined", () => {
            if (!active || typeof frame.getOnlineParticipants !== "function") return;
            syncParticipants(frame.getOnlineParticipants());
          });
        }
        frame.init(
          {
            roomURL: creds.room_url,
            accessToken: creds.access_token,
            name: userName,
            autoJoin: true,
            width: "100%",
            height: "100%",
            joinVideoOn: true,
            joinAudioOn: true,
          },
          containerRef.current,
        );
        setStatus("Connected to call");
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.detail || "Unable to load video call");
        setStatus("Call unavailable");
      }
    };

    mountCall();

    return () => {
      active = false;
      if (frameRef.current?.destroy) {
        frameRef.current.destroy();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [roomCode, userName]);

  return (
    <section className="panel video-panel">
      <div className="panel-header">Video / Voice</div>
      <p className="status">{status}</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="video-controls">
        <button type="button" onClick={toggleMic}>
          {micMuted ? "Unmute Mic" : "Mute Mic"}
        </button>
        <button type="button" onClick={toggleCamera}>
          {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
        </button>
        <button type="button" onClick={toggleChat}>
          Open Call Chat
        </button>
        <select value={layoutMode} onChange={(e) => setLayoutMode(e.target.value)}>
          <option value="focus">Focus Layout</option>
          <option value="balanced">Balanced Layout</option>
          <option value="compact">Compact Layout</option>
        </select>
      </div>
      <div className={`video-layout ${layoutMode}`}>
        <div className="video-frame-shell">
          <div ref={containerRef} className="video-frame-container" />
        </div>
        <aside className="video-participants">
          <h4>In Call</h4>
          {participants.length === 0 ? <p>No participants yet.</p> : null}
          <ul>
            {participants.map((participant) => (
              <li key={participant.id}>{participant.name}</li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
