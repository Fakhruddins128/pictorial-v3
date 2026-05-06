import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Card,
  Row,
  Col,
  Spinner,
  Alert,
  Table,
  Modal,
} from "react-bootstrap";
import { searchItems } from "../api/items";

const SearchItems = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowModal(true);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await searchItems(searchTerm);
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form onSubmit={handleSearch} className="mb-4">
        <Row>
          <Col md={8}>
            <Form.Control
              type="text"
              placeholder="Search by item code, old code, or product name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col md={4}>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "Search"}
            </Button>
          </Col>
        </Row>
      </Form>

      {error && <Alert variant="danger">{error}</Alert>}

      {items.length > 0 ? (
        <Card>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Old Code</th>
                  <th>Item Code</th>
                  <th>Product Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.itemcode}>
                    <td>{item.oldcode}</td>
                    <td>{item.itemcode}</td>
                    <td>{item.productname}</td>
                    <td>{item.description}</td>
                    <td>Rs.{item.saleprice.toFixed(2)}</td>
                    <td>{item.active ? "Active" : "Inactive"}</td>
                    <td>
                      {item.picture && (
                        <img
                          src={
                            `https://mcm-v2.s3.me-central-1.amazonaws.com/fpImages/` +
                            item.picture
                          }
                          alt={item.productname}
                          style={{
                            maxWidth: "100px",
                            maxHeight: "100px",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            handleImageClick(
                              `https://mcm-v2.s3.me-central-1.amazonaws.com/fpImages/` +
                                item.picture
                            )
                          }
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        !loading && (
          <Alert variant="info">
            No items found. Try a different search term.
          </Alert>
        )
      )}
      {/* Image Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Product Image</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={selectedImage}
            alt="Enlarged product"
            style={{ maxWidth: "100%", maxHeight: "80vh" }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SearchItems;
