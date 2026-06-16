'use client';


import React, { useState } from 'react';
import { Card, Table, Badge, Form, Row, Col, InputGroup, Button, Modal } from 'react-bootstrap';
import {
  IoPeopleOutline, IoShieldCheckmarkOutline, IoHeadsetOutline,
  IoPersonOutline, IoSearchOutline, IoFilterOutline, IoInformationCircleOutline,
  IoAddOutline, IoPencilOutline, IoTrashOutline
} from 'react-icons/io5';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getBackendUrl } from '@/utils/api';

export default function AdminUsersPage() {
  const { showToast } = useUI();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [saving, setSaving] = useState(false);

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['adminUsers'],
    staleTime: 0,
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/auth/users`);
        if (res.data.success) {
          return res.data.users;
        }
        throw new Error('Not successful');
      } catch (err) {
        console.warn('Backend server unseeded or offline, falling back to mock users list');
        return [
          { _id: 'mock-u-1', name: 'Tanhabir Rahman (Mock)', email: 'admin@customwearbd.com', phone: '01999999999', role: 'admin', createdAt: new Date().toISOString() },
          { _id: 'mock-u-2', name: 'Siam Rahman (Mock)', email: 'customer@email.com', phone: '01712345678', role: 'customer', createdAt: new Date().toISOString() },
          { _id: 'mock-u-3', name: 'Nabil Chowdhury (Mock)', email: 'support@email.com', phone: '01812345678', role: 'support', createdAt: new Date().toISOString() },
          { _id: 'mock-u-4', name: 'Kaiser Ahmed (Mock)', email: 'manager@email.com', phone: '01512345678', role: 'manager', createdAt: new Date().toISOString() }
        ];
      }
    }
  });

  const users = usersData || [];

  // Analytical metrics
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'superAdmin').length;
  const staffCount = users.filter(u => u.role === 'manager' || u.role === 'support').length;
  const customerCount = users.filter(u => u.role === 'customer').length;

  // Filtering
  const filteredUsers = users.filter(u => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchString)) ||
      (u.email && u.email.toLowerCase().includes(searchString)) ||
      (u.phone && u.phone.includes(searchTerm));
      
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  // Modal Open Actions
  const handleOpenAdd = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('customer');
    setShowAddModal(true);
  };

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone);
    setRole(u.role);
    setShowEditModal(true);
  };

  // CRUD Submissions
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !role) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/auth/users`, {
        name,
        email,
        phone,
        password,
        role
      });

      if (res.data.success) {
        showToast('User account created successfully!', 'success');
        setShowAddModal(false);
        refetch();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating user account', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !role) {
      showToast('Please fill out all fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(`${getBackendUrl()}/api/auth/users/${selectedUser._id}`, {
        name,
        email,
        phone,
        role
      });

      if (res.data.success) {
        showToast('User account updated successfully!', 'success');
        setShowEditModal(false);
        refetch();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating user account', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.role === 'admin' || u.role === 'superAdmin') {
      showToast('Administrative accounts cannot be deleted', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the user account for "${u.name}"?`)) {
      return;
    }

    try {
      const res = await axios.delete(`${getBackendUrl()}/api/auth/users/${u._id}`);
      if (res.data.success) {
        showToast('User account deleted successfully', 'info');
        refetch();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting user account', 'error');
    }
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
      
      {/* A. USER STATISTICS METRIC CARDS */}
      <Row className="g-3">
        <Col lg={3} md={6}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3">
            <Card.Body className="p-1 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block small mb-1">Total Registrations</span>
                <h4 className="fw-extrabold mb-0" style={{ color: 'var(--primary-navy)' }}>
                  {totalUsers}
                </h4>
              </div>
              <div className="rounded bg-primary bg-opacity-10 text-primary p-3">
                <IoPeopleOutline size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3">
            <Card.Body className="p-1 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block small mb-1">Administrators</span>
                <h4 className="fw-extrabold text-danger mb-0">
                  {adminCount}
                </h4>
              </div>
              <div className="rounded bg-danger bg-opacity-10 text-danger p-3">
                <IoShieldCheckmarkOutline size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3">
            <Card.Body className="p-1 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block small mb-1">Staff / Support</span>
                <h4 className="fw-extrabold text-info mb-0">
                  {staffCount}
                </h4>
              </div>
              <div className="rounded bg-info bg-opacity-10 text-info p-3">
                <IoHeadsetOutline size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3">
            <Card.Body className="p-1 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block small mb-1">Consumers</span>
                <h4 className="fw-extrabold text-success mb-0">
                  {customerCount}
                </h4>
              </div>
              <div className="rounded bg-success bg-opacity-10 text-success p-3">
                <IoPersonOutline size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* B. MAIN INTERACTIVE CARD TABLE */}
      <Card className="custom-card border-0 p-4 shadow-sm bg-white rounded-4">
        <Card.Body className="p-0">
          <div className="d-flex justify-content-between align-items-md-center flex-column flex-md-row gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
                <IoPeopleOutline /> User Account Manager
              </h5>
              <p className="text-muted small mb-0 d-flex align-items-center gap-1">
                <IoInformationCircleOutline className="text-danger" size={16} />
                Administrative accounts are locked against modification and deletion for security.
              </p>
            </div>
            
            <Button
              variant="danger"
              onClick={handleOpenAdd}
              className="btn-premium-accent bg-red-gradient border-0 px-3 py-2 d-flex align-items-center gap-2 rounded-3 align-self-start"
            >
              <IoAddOutline size={20} /> Add New User
            </Button>
          </div>

          {/* Search and Filters Header Toolbar */}
          <Row className="gy-3 mb-4">
            <Col md={7}>
              <InputGroup className="premium-input-group">
                <InputGroup.Text className="bg-light border-end-0">
                  <IoSearchOutline size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search user by Name, Email, or Phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control-premium border-start-0 ps-0"
                />
              </InputGroup>
            </Col>

            <Col md={5}>
              <InputGroup className="premium-input-group">
                <InputGroup.Text className="bg-light border-end-0">
                  <IoFilterOutline size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="form-control-premium border-start-0 ps-0"
                >
                  <option value="">Filter by Role Status (All)</option>
                  <option value="customer">Customer</option>
                  <option value="support">Support</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>

          {isLoading ? (
            <div className="skeleton mb-3" style={{ height: '220px' }}></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <IoPeopleOutline size={44} className="text-muted mb-2 opacity-50" />
              <span className="text-muted d-block small">No registered accounts match your filters.</span>
            </div>
          ) : (
            <Table responsive bordered hover className="align-middle text-center small mb-0" style={{ fontSize: '13.5px' }}>
              <thead className="table-dark">
                <tr>
                  <th>Customer Name</th>
                  <th>Email Address</th>
                  <th>Contact Phone</th>
                  <th>Join Date</th>
                  <th>Role Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin' || u.role === 'superAdmin';
                  const dateString = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-BD', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  }) : 'N/A';
                  
                  return (
                    <tr key={u._id} className={isAdmin ? 'bg-light bg-opacity-50' : ''}>
                      <td className="fw-bold text-start ps-3 d-flex align-items-center gap-2 py-3">
                        <span className={`avatar-circle-sm-table ${isAdmin ? 'bg-danger' : 'bg-secondary'}`}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                        <div>
                          <strong className="d-block text-dark">{u.name}</strong>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td className="text-muted">{dateString}</td>
                      <td>
                        <Badge bg={isAdmin ? 'danger' : u.role === 'support' ? 'info' : u.role === 'manager' ? 'warning' : 'secondary'} className="uppercase px-2 py-1 font-monospace" style={{ fontSize: '10px' }}>
                          {u.role}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-dark"
                            size="sm"
                            disabled={isAdmin}
                            onClick={() => handleOpenEdit(u)}
                            className="rounded-2 d-flex align-items-center justify-content-center p-2"
                          >
                            <IoPencilOutline size={15} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            disabled={isAdmin}
                            onClick={() => handleDeleteUser(u)}
                            className="rounded-2 d-flex align-items-center justify-content-center p-2"
                          >
                            <IoTrashOutline size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* C. ADD USER MODAL */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Add New User Account</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="small fw-semibold">Full Name *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="form-control-premium"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Email Address *</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="form-control-premium"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Phone Number *</Form.Label>
              <Form.Control
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter contact number (e.g. 017...)"
                className="form-control-premium"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Password *</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                className="form-control-premium"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Role assignment *</Form.Label>
              <Form.Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-control-premium"
              >
                <option value="customer">Customer</option>
                <option value="support">Support</option>
                <option value="manager">Manager</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} variant="danger" size="sm" className="bg-red-gradient border-0 px-4">
              {saving ? 'Creating account...' : 'Create Account'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* D. EDIT USER MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Edit User Account</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="small fw-semibold">Full Name *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-control-premium"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Email Address *</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control-premium"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Phone Number *</Form.Label>
              <Form.Control
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-control-premium"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Role *</Form.Label>
              <Form.Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-control-premium"
              >
                <option value="customer">Customer</option>
                <option value="support">Support</option>
                <option value="manager">Manager</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} variant="danger" size="sm" className="bg-red-gradient border-0 px-4">
              {saving ? 'Saving changes...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .avatar-circle-sm-table {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }
        .premium-input-group {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .premium-input-group .input-group-text {
          border: 1px solid #dee2e6;
        }
        .premium-input-group .form-control-premium,
        .premium-input-group .form-select {
          border: 1px solid #dee2e6;
        }
      `}</style>

    </div>
  );
}
