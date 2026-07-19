'use client';
import { useState, useEffect } from 'react';
import { Card, Table, Badge, Form, Button } from 'react-bootstrap';
import { IoColorPaletteOutline, IoEyeOutline } from 'react-icons/io5';
import axios from 'axios';
import { getBackendUrl, getProductImageUrl } from '../../../utils/api';
import { useUI } from '../../../context/UIContext';
import { useRouter } from 'next/navigation';

export default function CustomOrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const { showToast } = useUI();
  const router = useRouter();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getBackendUrl()}/api/custom-orders/admin?status=${statusFilter}`, { withCredentials: true });
      if (res.data.success) {
        setOrders(res.data.customOrders);
      }
    } catch (err) {
      console.error('Error fetching custom orders:', err);
      showToast('Failed to load custom orders', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(`${getBackendUrl()}/api/custom-orders/admin/${id}/status`, { status: newStatus }, { withCredentials: true });
      if (res.data.success) {
        showToast('Status updated', 'success');
        fetchOrders();
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0"><IoColorPaletteOutline className="me-2" /> Custom Orders</h4>
        <div style={{ width: '200px' }}>
          <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </Form.Select>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="border-0 py-3">Order Preview</th>
                <th className="border-0 py-3">Customer</th>
                <th className="border-0 py-3">Type</th>
                <th className="border-0 py-3">Status</th>
                <th className="border-0 py-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5">No custom orders found.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img src={getProductImageUrl(order.previewImage)} alt="Preview" style={{ width: 50, height: 50, objectFit: 'contain', background: '#f8f9fa', borderRadius: '8px' }} />
                        <div>
                          <small className="d-block text-muted">ID: {order._id.substring(order._id.length - 6)}</small>
                          <Badge bg="info" className="text-white">CUSTOM DESIGN</Badge>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="fw-medium">{order.orderId?.shippingAddress?.name || order.userId?.name || 'Guest'}</div>
                      <small className="text-muted">{order.orderId?.shippingAddress?.phone || order.userId?.phone || 'N/A'}</small>
                    </td>
                    <td>
                      <span className="text-capitalize">{order.productType}</span><br/>
                      <small>Color: <span style={{ display:'inline-block', width:12, height:12, background:order.color, borderRadius:'50%', border:'1px solid #ccc' }}></span></small>
                    </td>
                    <td>
                      <Form.Select 
                        size="sm" 
                        value={order.status} 
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        style={{ width: '130px', fontSize: '13px' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </Form.Select>
                    </td>
                    <td className="text-end">
                      <Button variant="light" size="sm" onClick={() => router.push(`/admincloth/custom-orders/${order._id}`)}>
                        <IoEyeOutline size={16} /> Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
