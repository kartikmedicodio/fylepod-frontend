import api from "../utils/api";

export const createChat = async (documentIds) => {
  try {
    const response = await api.post("/chat", { documentIds });
    return response.data.data.chat;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

export const sendMessage = async (chatId, message) => {
  try {
    const response = await api.post(`/chat/${chatId}/messages`, { message });
    return response.data.data.message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const getChats = async () => {
  const { data } = await api.get("/chat");
  return data.chats;
};
