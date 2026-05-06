import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import ItemsPage from "./pages/ItemsPage";
import GalleryPage from "./pages/GalleryPage";
import AuthRoute from "./components/AuthRoute";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          {/* <Route path="/login" element={<LoginPage />} /> */}
          <Route
            path="/items"
            element={
              <AuthRoute>
                <ItemsPage />
              </AuthRoute>
            }
          />
          {/* Gallery route */}
          <Route
            path="/gallery"
            element={
              <AuthRoute>
                <GalleryPage />
              </AuthRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
