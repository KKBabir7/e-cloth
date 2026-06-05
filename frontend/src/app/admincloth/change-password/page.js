'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { IoShieldCheckmarkOutline, IoLockClosedOutline } from 'react-icons/io5';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { getBackendUrl } from '@/utils/api';

export default function AdminChangePasswordPage() {
  const { showToast } = useUI();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(`${getBackendUrl()}/api/auth/change-password`, {
        currentPassword,
        newPassword
      });

      if (res.data.success) {
        showToast('Password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="custom-card border-0 p-4 shadow-sm bg-white" style={{ maxWidth: '600px' }}>
      <Card.Body>
        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
          <IoShieldCheckmarkOutline /> Change Admin Password
        </h5>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formCurrentPassword">
            <Form.Label className="small fw-semibold">Current Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-control-premium"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formNewPassword">
            <Form.Label className="small fw-semibold">New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter new password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-control-premium"
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="formConfirmPassword">
            <Form.Label className="small fw-semibold">Confirm New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-control-premium"
              required
            />
          </Form.Group>

          <Button
            type="submit"
            variant="danger"
            disabled={loading}
            className="w-100 btn-premium-accent d-flex align-items-center justify-content-center gap-2"
          >
            <IoLockClosedOutline size={18} />
            {loading ? 'Updating Password...' : 'Save Password Configurations'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
