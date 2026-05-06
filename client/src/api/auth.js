import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

export const loginUser = async (username, password) => {
  const response = await axios.post(`${API_BASE_URL}/login`, {
    username,
    password,
  });
  return response.data;
};
