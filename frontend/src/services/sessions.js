import api from "./api";

export async function startSession(roomCode, language) {
  const { data } = await api.post(`/sessions/${roomCode}/start?language=${encodeURIComponent(language)}`);
  return data;
}

export async function endSession(roomCode) {
  const { data } = await api.post(`/sessions/${roomCode}/end`);
  return data;
}

export async function getSessionHistory(roomCode) {
  const { data } = await api.get(`/sessions/${roomCode}/history`);
  return data;
}

export async function createSessionFeedback(roomCode, payload) {
  const { data } = await api.post(`/sessions/${roomCode}/feedback`, payload);
  return data;
}

export async function getSessionFeedback(roomCode) {
  const { data } = await api.get(`/sessions/${roomCode}/feedback`);
  return data;
}
