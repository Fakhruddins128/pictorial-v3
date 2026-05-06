import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/constants";
import {
  Container,
  Row,
  Col,
  Card,
  Modal,
  Button,
  Spinner,
  Alert,
  Badge,
  Form,
  Dropdown,
  Table,
} from "react-bootstrap";
import { getAuthHeader } from "../utils/auth";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const GalleryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [subGroups, setSubGroups] = useState([]);
  const [stockVariants, setStockVariants] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [storeStock, setStoreStock] = useState([]);
  const [loadingStoreStock, setLoadingStoreStock] = useState(false);
  const [storeStockError, setStoreStockError] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);
  const [showStoreStock, setShowStoreStock] = useState(false);

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subGroupFilter, setSubGroupFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name-asc");
  const [priceRange, setPriceRange] = useState([0, 1000]);

  const sortedSubGroups = [...subGroups].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/items`, {
          headers: getAuthHeader(),
        });
        const validItems = response.data
          .filter((item) => item.picture)
          .map((item) => ({
            ...item,
            saleprice: item.saleprice || 0,
            active: item.active !== false,
            FKSubGroupID: item.FKSubGroupID || null,
            desc_subgroup: item.desc_subgroup || "No Subgroup",
          }));

        setItems(validItems);

        // Update the subgroup extraction code to use desc_subgroup
        const uniqueSubGroups = [
          ...new Set(
            validItems
              .map((item) => ({
                id: item.FKSubGroupID,
                name: item.desc_subgroup,
              }))
              .filter((subgroup) => subgroup.id !== null)
          ),
        ].reduce((acc, current) => {
          if (!acc.some((item) => item.id === current.id)) {
            acc.push(current);
          }
          return acc;
        }, []);

        setSubGroups(uniqueSubGroups);

        if (validItems.length > 0) {
          const maxPrice = Math.ceil(
            Math.max(...validItems.map((item) => item.saleprice)) + 10
          );
          setPriceRange([0, maxPrice]);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load items");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Fetch stock variants
  const fetchStockVariants = async (itemCodePrefix) => {
    setLoadingStock(true);
    setStockError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/stock/${itemCodePrefix}`,
        { headers: getAuthHeader() }
      );
      setStockVariants(response.data);
    } catch (err) {
      setStockError(err.response?.data?.error || "Failed to load stock data");
    } finally {
      setLoadingStock(false);
    }
  };

  // Fetch store stock
  const fetchStoreStock = async (itemCode) => {
    setLoadingStoreStock(true);
    setStoreStockError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/store-stock/${itemCode}`,
        { headers: getAuthHeader() }
      );
      setStoreStock(response.data);
    } catch (err) {
      setStoreStockError(
        err.response?.data?.error || "Failed to load store stock"
      );
    } finally {
      setLoadingStoreStock(false);
    }
  };

  const openImageModal = async (item) => {
    setSelectedItem(item);
    setShowModal(true);
    setShowStoreStock(false);
    const itemCodePrefix = item.itemcode.substring(0, 6);
    await fetchStockVariants(itemCodePrefix);
  };

  const handleShowStoreStock = async (variant) => {
    setActiveVariant(variant);
    setShowStoreStock(true);
    await fetchStoreStock(variant.ItemCode);
  };

  const handleBackToProduct = () => {
    setShowStoreStock(false);
  };

  // Apply filters and sorting
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.productname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.oldcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.active) ||
      (statusFilter === "inactive" && !item.active);
    const matchesSubGroup =
      subGroupFilter === "all" ||
      String(item.FKSubGroupID) === String(subGroupFilter);
    const matchesPrice =
      item.saleprice >= priceRange[0] && item.saleprice <= priceRange[1];
    return matchesSearch && matchesStatus && matchesSubGroup && matchesPrice;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortOption) {
      case "name-asc":
        return a.productname.localeCompare(b.productname);
      case "name-desc":
        return b.productname.localeCompare(a.productname);
      case "price-asc":
        return a.saleprice - b.saleprice;
      case "price-desc":
        return b.saleprice - a.saleprice;
      case "code-asc":
        return a.itemcode.localeCompare(b.itemcode);
      case "code-desc":
        return b.itemcode.localeCompare(a.itemcode);
      default:
        return 0;
    }
  });

  if (loading)
    return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error)
    return (
      <Alert variant="danger" className="mt-3">
        {error}
      </Alert>
    );

  return (
    <Container className="my-5">
      <h2 className="mb-4 text-center">Finish Product Gallery</h2>

      {/* Filter and Sort Controls */}
      <div className="mb-4 p-3 bg-light rounded-3">
        <Row className="g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Product Name, Item Code or Old Code"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={subGroupFilter}
                onChange={(e) => setSubGroupFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {sortedSubGroups.map((subGroup) => (
                  <option key={subGroup.id} value={subGroup.id}>
                    {subGroup.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Sort By</Form.Label>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                  {sortOption
                    .replace("-", " ")
                    .replace("asc", "↑")
                    .replace("desc", "↓")}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setSortOption("name-asc")}>
                    Name (A-Z)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortOption("name-desc")}>
                    Name (Z-A)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortOption("price-asc")}>
                    Price (Low-High)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortOption("price-desc")}>
                    Price (High-Low)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortOption("code-asc")}>
                    Code (A-Z)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortOption("code-desc")}>
                    Code (Z-A)
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Results Count */}
      <div className="mb-3 text-muted">
        Showing {sortedItems.length} of {items.length} products
      </div>

      {/* Product Grid */}
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {sortedItems.map((item) => (
          <Col key={item.itemcode}>
            <Card className="h-100 product-card">
              <div
                className="product-image-container"
                onClick={() => openImageModal(item)}
              >
                <Card.Img
                  variant="top"
                  src={
                    `https://mcm-v2.s3.me-central-1.amazonaws.com/fpImages/` +
                    item.picture
                  }
                  alt={item.productname}
                />
                {!item.active && (
                  <Badge
                    bg="danger"
                    className="position-absolute top-0 end-0 m-2"
                  >
                    Inactive
                  </Badge>
                )}
              </div>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="product-title fs-6">
                  {item.productname}
                </Card.Title>
                <Card.Text className="mt-auto">
                  <small className="text-muted d-block">
                    Item Code: {item.itemcode}
                  </small>
                  <small className="text-muted d-block">
                    Old Code: {item.oldcode}
                  </small>
                  <strong className="price fs-5">
                    Rs {item.saleprice.toFixed(2)}
                  </strong>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* No Results Message */}
      {sortedItems.length === 0 && (
        <Alert variant="info" className="mt-4 text-center">
          No products match your filters. Try adjusting your search criteria.
        </Alert>
      )}

      {/* Product Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showStoreStock
              ? `Store Stock - ${activeVariant?.ItemCode}`
              : selectedItem?.productname}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showStoreStock ? (
            <div>
              <Button
                variant="outline-secondary"
                onClick={handleBackToProduct}
                className="mb-3"
              >
                ← Back to Product
              </Button>
              <h5>Store-wise Stock for: {activeVariant?.ItemCode}</h5>
              {loadingStoreStock ? (
                <Spinner animation="border" />
              ) : storeStockError ? (
                <Alert variant="danger">{storeStockError}</Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Store Code</th>
                        <th>Store Name</th>
                        <th>Category</th>
                        <th>Material</th>
                        <th>Color</th>
                        <th>Finish</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storeStock.map((store, index) => (
                        <tr key={index}>
                          <td>{store.BrCode}</td>
                          <td>{store.Store}</td>
                          <td>{store.Category}</td>
                          <td>{store.Material}</td>
                          <td>{store.Color}</td>
                          <td>{store.Finish}</td>
                          <td>{store.Stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <Row>
              <Col md={6}>
                <img
                  src={
                    `https://mcm-v2.s3.me-central-1.amazonaws.com/fpImages/` +
                    selectedItem?.picture
                  }
                  alt={selectedItem?.productname}
                  className="img-fluid mb-3"
                />
                <div className="product-details">
                  <p>
                    <strong>Item Code:</strong> {selectedItem?.itemcode}
                  </p>
                  <p>
                    <strong>Old Code:</strong> {selectedItem?.oldcode}
                  </p>
                  <p>
                    <strong>Price:</strong> Rs{" "}
                    {selectedItem?.saleprice?.toFixed(2)}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Badge bg={selectedItem?.active ? "success" : "danger"}>
                      {selectedItem?.active ? "Active" : "Inactive"}
                    </Badge>
                  </p>
                </div>
              </Col>
              <Col md={6}>
                <h5>Stock Variants</h5>
                {loadingStock ? (
                  <Spinner animation="border" />
                ) : stockError ? (
                  <Alert variant="danger">{stockError}</Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Variant</th>
                          <th>Color</th>
                          <th>Finish</th>
                          <th>Total Stock</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockVariants.map((variant, index) => (
                          <tr key={index}>
                            <td>{variant.ItemCode}</td>
                            <td>{variant.Color}</td>
                            <td>{variant.Finish}</td>
                            <td>{variant.Stock}</td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowStoreStock(variant)}
                              >
                                Detail
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default GalleryPage;
