'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { IoShieldCheckmarkOutline, IoLogInOutline } from 'react-icons/io5';
import { login, logout, clearErrors } from '../../../store/authSlice';
import { useUI } from '../../../context/UIContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useUI();

  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const { register: registerField, handleSubmit, formState: { errors } } = useForm();

  // If already authenticated as admin, redirect to admin panel
  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'admin' || user.role === 'superAdmin')) {
      router.push('/admincloth');
    }
    return () => {
      dispatch(clearErrors());
    };
  }, [isAuthenticated, user]);

  const onSubmit = async (data) => {
    try {
      // 1. Attempt login via Redux authentication hook
      const result = await dispatch(login({
        loginIdentifier: data.email,
        password: data.password
      })).unwrap();
      
      if (result.success) {
        const role = result.user.role;
        // 2. Enforce strict administrative authorization
        if (role !== 'admin' && role !== 'superAdmin') {
          showToast('Access denied. Non-administrative users are not permitted here.', 'error');
          // Instantly clear the invalid customer session
          await dispatch(logout()).unwrap();
        } else {
          showToast(`Welcome to Executive Control Panel, ${result.user.name.split(' ')[0]}!`, 'success');
          router.push('/admincloth');
        }
      }
    } catch (err) {
      showToast(err || 'Invalid admin credentials', 'error');
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark" style={{
      backgroundImage: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <Container style={{ maxWidth: '420px' }}>
        
        <div className="text-center mb-4">
          <div className="rounded-circle bg-danger bg-opacity-10 text-danger fw-bold d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
            <IoShieldCheckmarkOutline size={38} className="animate-pulse" />
          </div>
          <h3 className="fw-extrabold text-white mb-1">
            Secure <span className="text-danger">Admin</span> Access
          </h3>
          <p className="text-muted small">CustomWear BD Core Administration Gateway</p>
        </div>

        <Card className="border-0 shadow-lg p-4 bg-white rounded-4" style={{
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}>
          <Card.Body className="p-2">
            
            {error && (
              <Alert variant="danger" className="py-2 small" onClose={() => dispatch(clearErrors())} dismissible>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3">
              
              <Form.Group>
                <Form.Label className="small fw-semibold text-dark">Email Address *</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="admin@customwearbd.com"
                  className={`form-control-premium ${errors.email ? 'is-invalid' : ''}`}
                  {...registerField('email', {
                    required: 'Email address is required'
                  })}
                />
                {errors.email && (
                  <Form.Control.Feedback type="invalid">
                    {errors.email.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold text-dark">Password *</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="••••••••"
                  className={`form-control-premium ${errors.password ? 'is-invalid' : ''}`}
                  {...registerField('password', {
                    required: 'Password is required'
                  })}
                />
                {errors.password && (
                  <Form.Control.Feedback type="invalid">
                    {errors.password.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Button
                type="submit"
                disabled={loading}
                variant="danger"
                className="w-100 py-3 justify-content-center bg-red-gradient border-0 rounded-3 mt-2 fw-semibold d-flex align-items-center gap-2"
                style={{ fontSize: '15px' }}
              >
                <IoLogInOutline size={22} /> {loading ? 'Authorizing...' : 'Admin Sign In'}
              </Button>

            </Form>

          </Card.Body>
        </Card>

        <div className="text-center mt-4">
          <Button variant="link" onClick={() => router.push('/')} className="text-muted text-decoration-none small hover-white">
            ← Return to Consumer Store
          </Button>
        </div>

      </Container>

      <style>{`
        .hover-white:hover {
          color: #ffffff !important;
          transition: 0.2s;
        }
        .animate-pulse {
          animation: nav-pulse 2s infinite;
        }
        @keyframes nav-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
