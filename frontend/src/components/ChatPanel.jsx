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
    <section className="panel chat-panel">
      <h3>Chat</h3>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <p key={`${m.user}-${i}`}>
            <strong>{m.user}:</strong> {m.message}
          </p>
        ))}
      </div>
      <form onSubmit={submit}>
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type message..." />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
