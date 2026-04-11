import api from "./api";

export async function getVideoCredentials(roomCode) {
  const { data } = await api.get(`/video/rooms/${roomCode}/credentials`);
  return data;
}
