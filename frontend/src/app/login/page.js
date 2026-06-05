'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { IoLogInOutline, IoPersonAddOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import { login, clearErrors } from '../../store/authSlice';
import { fetchCart } from '../../store/cartSlice';
import { useUI } from '../../context/UIContext';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Container className="py-5 text-center">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-3">Loading Login...</p>
      </Container>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { showToast } = useUI();

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const redirect = searchParams.get('redirect') || '/';

  const { register: registerField, handleSubmit, formState: { errors } } = useForm();

  // If already authenticated, redirect away
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirect);
    }
    return () => {
      dispatch(clearErrors());
    };
  }, [isAuthenticated, redirect]);

  const onSubmit = async (data) => {
    try {
      const result = await dispatch(login({
        loginIdentifier: data.emailOrPhone,
        password: data.password
      })).unwrap();
      
      if (result.success) {
        showToast(`Welcome back, ${result.user.name.split(' ')[0]}!`, 'success');
        dispatch(fetchCart());
      }
    } catch (err) {
      showToast(err || 'Invalid login credentials', 'error');
    }
  };

  return (
    <Container className="py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        
        <Card className="custom-card border-0 shadow p-4 glass-panel bg-white">
          <Card.Body>
            
            <div className="text-center mb-4">
              <h3 className="fw-extrabold" style={{ color: 'var(--primary-navy)' }}>
                Welcome <span className="text-danger">Back</span>
              </h3>
              <p className="text-muted small">Access your profile, customized designs, and track orders</p>
            </div>

            {error && (
              <Alert variant="danger" className="py-2 small" onClose={() => dispatch(clearErrors())} dismissible>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3">
              
              <Form.Group>
                <Form.Label className="small fw-semibold text-dark">Email Address or Phone *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. test@email.com or 017..."
                  className={`form-control-premium ${errors.emailOrPhone ? 'is-invalid' : ''}`}
                  {...registerField('emailOrPhone', {
                    required: 'Please enter your email address or wallet phone'
                  })}
                />
                {errors.emailOrPhone && (
                  <Form.Control.Feedback type="invalid">
                    {errors.emailOrPhone.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold text-dark">Password *</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="••••••"
                  className={`form-control-premium ${errors.password ? 'is-invalid' : ''}`}
                  {...registerField('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
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
                className="w-100 btn-premium-accent py-3 justify-content-center bg-red-gradient"
              >
                <IoLogInOutline size={22} /> {loading ? 'Logging in...' : 'Sign In'}
              </Button>

            </Form>

            <hr className="my-4" />

            <div className="text-center" style={{ fontSize: '13.5px' }}>
              <span className="text-muted">Don't have a corporate profile yet?</span>
              <br />
              <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-danger fw-bold text-decoration-none d-inline-flex align-items-center gap-1 mt-1">
                <IoPersonAddOutline /> Create Account Now
              </Link>
            </div>

            <div className="text-center mt-3 border-top pt-3" style={{ fontSize: '12.5px' }}>
              <span className="text-muted">Are you a store administrator?</span>
              <br />
              <Link href="/admincloth/login" className="text-dark fw-bold text-decoration-none d-inline-flex align-items-center gap-1 mt-1" style={{ transition: 'color 0.2s' }}>
                <IoShieldCheckmarkOutline size={14} className="text-danger" /> Admin Secure Portal →
              </Link>
            </div>

          </Card.Body>
        </Card>

      </div>
    </Container>
  );
}
