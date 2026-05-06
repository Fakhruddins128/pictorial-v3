import React from "react";
import { Container, Navbar, Nav, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from "../utils/auth";
import logo from "../images/jjslogo.png"; // Import your logo image

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <Navbar bg="light" variant="light" expand="lg">
        <Container>
          <Navbar.Brand href="/" className="d-flex align-items-center">
            <img
              src={logo}
              alt="Company Logo"
              style={{
                height: "40px", // Adjust height as needed
                marginRight: "10px", // Space between logo and text
              }}
            />
            Pictorial Online
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {authenticated && <Nav.Link href="/items">Items</Nav.Link>}
              {authenticated && <Nav.Link href="/gallery">Gallery</Nav.Link>}
            </Nav>
            {authenticated && (
              <Button variant="outline-dark" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="mt-4">{children}</Container>
    </>
  );
};

export default Layout;
