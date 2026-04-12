export default function ParticipantList({ participants = [] }) {
  return (
    <div className="participant-list">
      <h4>Participants</h4>
      <ul>
        {participants.length === 0 ? <li>No one online</li> : null}
        {participants.map((p, i) => (
          <li key={`${p.name}-${i}`}>
            <span>{p.name}</span>
            <span className="role-pill">{p.role || "member"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
