export default function ParticipantList({ participants = [] }) {
  return (
    <div className="participant-list">
      <h4>Participants</h4>
      <ul>
        {participants.length === 0 ? <li>No one online</li> : null}
        {participants.map((p, i) => (
          <li key={`${p.name}-${i}`}>
            {p.name} ({p.role || "member"})
          </li>
        ))}
      </ul>
    </div>
  );
}
