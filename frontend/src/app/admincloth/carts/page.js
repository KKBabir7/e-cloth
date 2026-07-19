'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Badge, Spinner, Form, Row, Col } from 'react-bootstrap';
import { IoCartOutline, IoTrashOutline, IoTrashBinOutline, IoSearchOutline, IoChevronDownOutline } from 'react-icons/io5';
import axios from 'axios';
import { getBackendUrl, getProductImageUrl } from '../../../utils/api';
import { useUI } from '../../../context/UIContext';

export default function CartManagement() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('all');
  
  const { showToast } = useUI();

  const fetchCarts = useCallback(async (pageNumber = 1, append = false) => {
    if (pageNumber === 1 && !append) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await axios.get(
        `${getBackendUrl()}/api/cart/admin?page=${pageNumber}&limit=10&search=${search}&userType=${userType}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        if (append) {
          setCarts(prev => {
            // Prevent duplicate records on concurrent/race updates
            const existingIds = new Set(prev.map(c => c._id));
            const newCarts = res.data.carts.filter(c => !existingIds.has(c._id));
            return [...prev, ...newCarts];
          });
        } else {
          setCarts(res.data.carts);
        }
        setHasMore(res.data.hasMore);
        setPage(pageNumber);
      }
    } catch (err) {
      console.error('Error fetching admin carts:', err);
      showToast('Failed to load system carts', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, userType]);

  // Initial fetch and filters reset
  useEffect(() => {
    fetchCarts(1, false);
  }, [search, userType]);

  // Real-time SSE updates listener
  useEffect(() => {
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || getBackendUrl();
    const es = new EventSource(`${BACKEND}/api/events`);

    const handleUpdate = (e) => {
      try {
        const { type } = JSON.parse(e.data);
        if (type === 'carts') {
          // Instantly refresh first page of carts in real-time
          fetchCarts(1, false);
        }
      } catch (err) {
        console.error('SSE update parsing error:', err);
      }
    };

    es.addEventListener('update', handleUpdate);

    return () => {
      es.removeEventListener('update', handleUpdate);
      es.close();
    };
  }, [fetchCarts]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchCarts(page + 1, true);
    }
  };

  const handleDeleteCart = async (cartId) => {
    if (!window.confirm('Are you sure you want to delete this entire cart?')) return;
    try {
      const res = await axios.delete(`${getBackendUrl()}/api/cart/admin/${cartId}`, { withCredentials: true });
      if (res.data.success) {
        showToast('Cart deleted successfully', 'success');
        fetchCarts(1, false);
      }
    } catch (err) {
      showToast('Failed to delete cart', 'error');
    }
  };

  const handleDeleteItem = async (cartId, itemId) => {
    if (!window.confirm('Are you sure you want to remove this item from the cart?')) return;
    try {
      const res = await axios.delete(`${getBackendUrl()}/api/cart/admin/${cartId}/item/${itemId}`, { withCredentials: true });
      if (res.data.success) {
        showToast('Item removed from cart', 'success');
        fetchCarts(1, false);
      }
    } catch (err) {
      showToast('Failed to remove item', 'error');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0"><IoCartOutline className="me-2 text-danger" /> Cart Management</h4>
        <Button variant="outline-danger" size="sm" onClick={() => fetchCarts(1, false)} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* FILTER CONTROL BAR */}
      <Card className="border-0 shadow-sm p-3 mb-4 bg-white">
        <Row className="g-3">
          <Col md={7}>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Search by User name, email, or guest session ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-5 py-2.5 border-slate-200"
                style={{ borderRadius: '8px', fontSize: '14px' }}
              />
              <IoSearchOutline 
                className="position-absolute text-muted" 
                style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} 
                size={18}
              />
            </div>
          </Col>
          <Col md={5}>
            <Form.Select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="py-2.5 border-slate-200"
              style={{ borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="all">👥 All Carts</option>
              <option value="registered">✅ Registered Users Only</option>
              <option value="guest">👤 Guests Only</option>
            </Form.Select>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
          <p className="text-muted mt-2 small">Loading active carts...</p>
        </div>
      ) : carts.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <IoCartOutline size={48} className="text-muted mb-3 opacity-50" />
            <h6>No Active Carts Found</h6>
            <p className="text-muted small mb-0">No active carts match the selected filters or search terms.</p>
          </Card.Body>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-4">
          {carts.map((cart) => {
            const isGuest = !cart.userId;
            const itemsCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

            return (
              <Card key={cart._id} className="border border-light shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
                <Card.Header className="bg-light py-3 d-flex justify-content-between align-items-center border-0">
                  <div>
                    <span className="fw-bold text-dark d-block" style={{ fontSize: '15px' }}>
                      👤 {isGuest ? 'Guest Session' : cart.userId.name}
                    </span>
                    <small className="text-muted">
                      {isGuest ? `Session: ${cart.sessionId}` : `Email: ${cart.userId.email} • Phone: ${cart.userId.phone || 'N/A'}`}
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-end">
                      <Badge bg={isGuest ? 'secondary' : 'danger'} className="me-2 uppercase px-2 py-1" style={{ fontSize: '10px' }}>
                        {isGuest ? 'GUEST' : 'REGISTERED'}
                      </Badge>
                      <small className="text-muted d-block mt-0.5" style={{ fontSize: '10px' }}>
                        Active: {new Date(cart.updatedAt).toLocaleString('en-BD')}
                      </small>
                    </div>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="p-1 d-flex align-items-center justify-content-center rounded-circle" 
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => handleDeleteCart(cart._id)}
                      title="Delete Entire Cart"
                    >
                      <IoTrashBinOutline size={16} />
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0 align-middle">
                    <thead className="bg-white border-bottom">
                      <tr>
                        <th className="py-2.5 px-3 small fw-bold text-secondary">Product Preview</th>
                        <th className="py-2.5 small fw-bold text-secondary">Name & Options</th>
                        <th className="py-2.5 small fw-bold text-secondary">Price</th>
                        <th className="py-2.5 small fw-bold text-secondary">Qty</th>
                        <th className="py-2.5 small fw-bold text-secondary">Total</th>
                        <th className="py-2.5 text-end px-3 small fw-bold text-secondary">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.items.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted small">Cart is empty</td>
                        </tr>
                      ) : (
                        cart.items.map((item) => (
                          <tr key={item._id}>
                            <td className="px-3">
                              <img 
                                src={getProductImageUrl(item.previewImage || item.image)} 
                                alt="item preview" 
                                style={{ width: 45, height: 45, objectFit: 'contain', background: '#f8f9fa', borderRadius: '6px' }} 
                              />
                            </td>
                            <td>
                              <div className="fw-semibold text-dark" style={{ fontSize: '13.5px' }}>{item.name}</div>
                              <div className="text-muted d-flex align-items-center gap-2 mt-1" style={{ fontSize: '11px' }}>
                                <span>Size: <strong>{item.size}</strong></span>
                                {item.color && (
                                  <span className="d-flex align-items-center gap-1">
                                    Color: <span style={{ display: 'inline-block', width: 10, height: 10, backgroundColor: item.color, borderRadius: '50%', border: '1px solid #ccc' }}></span>
                                  </span>
                                )}
                                {item.isCustom && (
                                  <Badge bg="info" className="text-white px-1.5 py-0.5" style={{ fontSize: '9px' }}>CUSTOM</Badge>
                                )}
                              </div>
                            </td>
                            <td style={{ fontSize: '13.5px' }}>৳{item.price}</td>
                            <td style={{ fontSize: '13.5px' }}>{item.quantity}</td>
                            <td className="fw-bold" style={{ fontSize: '13.5px' }}>৳{item.price * item.quantity}</td>
                            <td className="text-end px-3">
                              <Button 
                                variant="light" 
                                size="sm" 
                                className="text-danger border-0 p-1 rounded-circle" 
                                onClick={() => handleDeleteItem(cart._id, item._id)}
                                title="Remove Item"
                              >
                                <IoTrashOutline size={15} />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                  
                  {cart.items.length > 0 && (
                    <div className="bg-light p-3 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '13px' }}>
                      <span className="text-muted">Total Items: <strong>{itemsCount}</strong></span>
                      <div>
                        <span className="text-muted me-3">Subtotal: ৳{cart.subtotal}</span>
                        {cart.discount > 0 && <span className="text-danger me-3">Discount: -৳{cart.discount}</span>}
                        <span className="fw-bold text-danger">Grand Total: ৳{cart.total}</span>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            );
          })}

          {/* INFINITE LOAD MORE BUTTON */}
          {hasMore && (
            <div className="text-center mt-3 mb-5">
              <Button 
                variant="outline-danger" 
                onClick={handleLoadMore} 
                disabled={loadingMore} 
                className="px-4 py-2 d-inline-flex align-items-center gap-2 font-semibold shadow-sm"
                style={{ borderRadius: '30px', fontSize: '14px' }}
              >
                {loadingMore ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Carts <IoChevronDownOutline size={16} />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
