import { useState } from "react";

export default function ChatPanel({ messages, onSend }) {
  const [message, setMessage] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  };

  return (
    <div className="chat-panel">
      <div className="panel-header">Team Chat</div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={`${m.user}-${i}`} className="chat-message">
            <strong>{m.user}</strong> {m.message}
          </div>
        ))}
      </div>
      <form className="chat-input-form" onSubmit={submit}>
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." />
        <button className="primary" type="submit">Send</button>
      </form>
    </div>
  );
}
