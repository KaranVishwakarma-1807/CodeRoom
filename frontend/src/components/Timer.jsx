export default function Timer({ seconds, isRunning, onStart, onPause, onReset }) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remaining = String(seconds % 60).padStart(2, "0");

  return (
    <div className="timer">
      <strong>{minutes}:{remaining}</strong>
      <button onClick={onStart} disabled={isRunning}>Start</button>
      <button onClick={onPause} disabled={!isRunning}>Pause</button>
      <button onClick={onReset}>Reset</button>
    </div>
  );
}
