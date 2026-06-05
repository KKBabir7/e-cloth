'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, ListGroup, Button, Badge } from 'react-bootstrap';
import { IoPersonOutline, IoReceiptOutline, IoColorPaletteOutline, IoLockClosedOutline } from 'react-icons/io5';
import { useUI } from '../../context/UIContext';

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useUI();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  // Secure route check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      showToast('Please login to access user account dashboard', 'error');
      router.push('/login?redirect=/account');
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-3">Loading Dashboard...</p>
      </Container>
    );
  }

  if (!user) return null;

  const sidebarLinks = [
    { name: 'My Profile', path: '/account', icon: <IoPersonOutline size={18} /> },
    { name: 'My Orders', path: '/account/orders', icon: <IoReceiptOutline size={18} /> },
    { name: 'Saved Designs', path: '/account/designs', icon: <IoColorPaletteOutline size={18} /> }
  ];

  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-4" style={{ color: 'var(--primary-navy)' }}>
        User <span className="text-danger">Dashboard</span>
      </h2>

      <Row className="gy-4">
        
        {/* LEFT SIDE: ACCOUNT SIDEBAR */}
        <Col lg={3}>
          <Card className="custom-card border-0 p-3 shadow-sm bg-white">
            <div className="text-center py-4 border-bottom">
              <div className="rounded-circle bg-danger bg-opacity-10 text-danger fw-bold d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '24px' }}>
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <h5 className="fw-bold mb-1">{user.name}</h5>
              <span className="text-muted small d-block">{user.email}</span>
              <Badge bg="danger" className="mt-2 bg-red-gradient uppercase" style={{ fontSize: '10px' }}>{user.role}</Badge>
            </div>

            <ListGroup variant="flush" className="pt-3 gap-1">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link key={link.path} href={link.path} passHref legacyBehavior>
                    <ListGroup.Item
                      action
                      className={`d-flex align-items-center gap-3 border-0 rounded-3 py-3 px-3 fw-medium ${isActive ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-dark'}`}
                      style={{ cursor: 'pointer', fontSize: '14.5px', transition: '0.2s' }}
                    >
                      {link.icon}
                      {link.name}
                    </ListGroup.Item>
                  </Link>
                );
              })}
            </ListGroup>
          </Card>
        </Col>

        {/* RIGHT SIDE: VIEWPORT CHILD PAGE */}
        <Col lg={9}>
          <div className="h-100">{children}</div>
        </Col>

      </Row>
    </Container>
  );
}
