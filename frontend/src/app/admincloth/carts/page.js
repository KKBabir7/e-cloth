'use client';
import { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { IoCartOutline, IoTrashOutline, IoTrashBinOutline } from 'react-icons/io5';
import axios from 'axios';
import { getBackendUrl, getProductImageUrl } from '../../../utils/api';
import { useUI } from '../../../context/UIContext';

export default function CartManagement() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useUI();

  const fetchCarts = async () => {
    try {
      const res = await axios.get(`${getBackendUrl()}/api/cart/admin`, { withCredentials: true });
      if (res.data.success) {
        setCarts(res.data.carts);
      }
    } catch (err) {
      console.error('Error fetching admin carts:', err);
      showToast('Failed to load system carts', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  const handleDeleteCart = async (cartId) => {
    if (!window.confirm('Are you sure you want to delete this entire cart?')) return;
    try {
      const res = await axios.delete(`${getBackendUrl()}/api/cart/admin/${cartId}`, { withCredentials: true });
      if (res.data.success) {
        showToast('Cart deleted successfully', 'success');
        fetchCarts();
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
        fetchCarts();
      }
    } catch (err) {
      showToast('Failed to remove item', 'error');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0"><IoCartOutline className="me-2 text-danger" /> Cart Management</h4>
        <Button variant="outline-danger" size="sm" onClick={fetchCarts} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Carts'}
        </Button>
      </div>

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
            <p className="text-muted small mb-0">There are currently no active user or guest carts stored in the database.</p>
          </Card.Body>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-4">
          {carts.map((cart) => {
            const isGuest = !cart.userId;
            const itemsCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

            return (
              <Card key={cart._id} className="border-0 shadow-sm overflow-hidden">
                <Card.Header className="bg-light py-3 d-flex justify-content-between align-items-center border-0">
                  <div>
                    <span className="fw-bold text-dark d-block">
                      👤 {isGuest ? 'Guest Session' : cart.userId.name}
                    </span>
                    <small className="text-muted">
                      {isGuest ? `Session ID: ${cart.sessionId.substring(0, 12)}...` : `Email: ${cart.userId.email} • Phone: ${cart.userId.phone || 'N/A'}`}
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-end">
                      <Badge bg={isGuest ? 'secondary' : 'danger'} className="me-2 uppercase small">
                        {isGuest ? 'GUEST' : 'REGISTERED'}
                      </Badge>
                      <small className="text-muted d-block mt-0.5" style={{ fontSize: '11px' }}>
                        Last Active: {new Date(cart.updatedAt).toLocaleString('en-BD')}
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
                                  <Badge bg="info" className="text-white" style={{ fontSize: '9px', padding: '2px 4px' }}>CUSTOM</Badge>
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
                  
                  {/* Cart Summary Bar */}
                  {cart.items.length > 0 && (
                    <div className="bg-light p-3 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '13.5px' }}>
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
        </div>
      )}
    </div>
  );
}
