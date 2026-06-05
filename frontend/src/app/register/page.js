'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { IoPersonAddOutline, IoLogInOutline } from 'react-icons/io5';
import { register, clearErrors } from '../../store/authSlice';
import { fetchCart } from '../../store/cartSlice';
import { useUI } from '../../context/UIContext';
import { validateBdPhone } from '../../../../shared/utils';

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <Container className="py-5 text-center">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-3">Loading Register...</p>
      </Container>
    }>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { showToast } = useUI();

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const redirect = searchParams.get('redirect') || '/';

  const { register: registerField, handleSubmit, formState: { errors } } = useForm();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirect);
    }
    return () => {
      dispatch(clearErrors());
    };
  }, [isAuthenticated, redirect]);

  const onSubmit = async (data) => {
    // 1. Enforce BD phone formatting check before server dispatch
    if (!validateBdPhone(data.phone)) {
      showToast('Please enter a valid Bangladesh phone number (+8801... or 01...)', 'error');
      return;
    }

    try {
      const result = await dispatch(register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password
      })).unwrap();

      if (result.success) {
        showToast(`Account registered successfully! Welcome ${result.user.name.split(' ')[0]}`, 'success');
        dispatch(fetchCart());
      }
    } catch (err) {
      showToast(err || 'Registration failed, please check inputs', 'error');
    }
  };

  return (
    <Container className="py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        <Card className="custom-card border-0 shadow p-4 glass-panel bg-white">
          <Card.Body>

            <div className="text-center mb-4">
              <h3 className="fw-extrabold" style={{ color: 'var(--primary-navy)' }}>
                Create <span className="text-danger">Account</span>
              </h3>
              <p className="text-muted small">Join CustomWear BD and design custom premium T-shirts</p>
            </div>

            {error && (
              <Alert variant="danger" className="py-2 small" onClose={() => dispatch(clearErrors())} dismissible>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3">

              <Form.Group>
                <Form.Label className="small fw-semibold text-dark">Full Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Arif Hossain"
                  className={`form-control-premium ${errors.name ? 'is-invalid' : ''}`}
                  {...registerField('name', {
                    required: 'Please enter your full name'
                  })}
                />
                {errors.name && (
                  <Form.Control.Feedback type="invalid">
                    {errors.name.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold text-dark">Email Address *</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="e.g. arif@email.com"
                  className={`form-control-premium ${errors.email ? 'is-invalid' : ''}`}
                  {...registerField('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please provide a valid email format'
                    }
                  })}
                />
                {errors.email && (
                  <Form.Control.Feedback type="invalid">
                    {errors.email.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold text-dark">Bangladesh Contact Phone *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. 01712345678"
                  className={`form-control-premium ${errors.phone ? 'is-invalid' : ''}`}
                  {...registerField('phone', {
                    required: 'Mobile phone number is required'
                  })}
                />
                {errors.phone && (
                  <Form.Control.Feedback type="invalid">
                    {errors.phone.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold text-dark">Create Password *</Form.Label>
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
                <IoPersonAddOutline size={22} /> {loading ? 'Creating account...' : 'Create Account'}
              </Button>

            </Form>

            <hr className="my-4" />

            <div className="text-center" style={{ fontSize: '13.5px' }}>
              <span className="text-muted">Already registered with us?</span>
              <br />
              <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-danger fw-bold text-decoration-none d-inline-flex align-items-center gap-1 mt-1">
                <IoLogInOutline size={22} /> Access Profile Login
              </Link>
            </div>

          </Card.Body>
        </Card>

      </div>
    </Container>
  );
}
