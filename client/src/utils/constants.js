const envApiBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();
const fallbackApiBaseUrl =
  process.env.NODE_ENV === "development" ? "http://localhost:5000/api" : "/api";

export const API_BASE_URL = (envApiBaseUrl || fallbackApiBaseUrl).replace(
  /\/$/,
  ""
);
