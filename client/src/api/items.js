import axios from "axios";
import { API_BASE_URL } from "../utils/constants";
import { getAuthHeader } from "../utils/auth";

export const searchItems = async (searchTerm) => {
  const response = await axios.get(`${API_BASE_URL}/items`, {
    params: { search: searchTerm },
    headers: getAuthHeader(),
  });
  return response.data;
};
