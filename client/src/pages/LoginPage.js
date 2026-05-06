import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
//import { loginUser } from "../api/auth";
import { login } from "../utils/auth";
import LoginForm from "../components/Login";
import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const LoginPage = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username: values.username,
        password: values.password,
      });

      if (response.data.token) {
        login(response.data.token);
        navigate("/items");
      } else {
        setError("Login failed - no token received");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.error ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Pictorial Login</h2>
        <LoginForm onSubmit={handleSubmit} error={error} />
      </div>
    </div>
  );
};

export default LoginPage;
