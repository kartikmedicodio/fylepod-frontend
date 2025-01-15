import api from "../utils/api";
import { setStoredToken } from "../utils/auth";

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data.data;
    setStoredToken(token);
    return { user, token };
  } catch (error) {
    throw error;
  }
};
