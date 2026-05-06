import React from "react";
import { Navbar, Card } from "react-bootstrap";

const HomePage = () => {
  return (
    <Card>
      <Card.Body>
        <Card.Title>Welcome to Jafferjees Pictorial</Card.Title>
        <Card.Text>
          Please <Navbar.Brand href="/login">Login</Navbar.Brand> to access the
          item management system.
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default HomePage;
