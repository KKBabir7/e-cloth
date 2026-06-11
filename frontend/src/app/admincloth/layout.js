'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Card, ListGroup, Badge, Button, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import {
  IoGridOutline, IoShirtOutline, IoReceiptOutline, IoPeopleOutline,
  IoGiftOutline, IoShieldCheckmarkOutline, IoHomeOutline, IoLogOutOutline,
  IoImagesOutline, IoLayersOutline, IoChatbubblesOutline
} from 'react-icons/io5';
import { logout } from '../../store/authSlice';
import { useUI } from '../../context/UIContext';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useUI();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  // Administrative RBAC Role Security check
  useEffect(() => {
    if (pathname === '/admincloth/login') return;

    if (!loading) {
      if (!isAuthenticated) {
        showToast('Please login first', 'error');
        router.push('/admincloth/login');
      } else if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
        showToast('Access denied. Admin credentials required.', 'error');
        router.push('/');
      }
    }
  }, [isAuthenticated, loading, user, pathname]);

  const handleAdminLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      showToast('Logged out from Administrative Panel successfully', 'info');
      router.push('/admincloth/login');
    } catch (err) {
      showToast('Logout failed', 'error');
    }
  };

  if (pathname === '/admincloth/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-3">Loading Administrative Panel...</p>
      </Container>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) return null;

  const adminLinks = [
    { name: 'Dashboard Stats', path: '/admincloth', icon: <IoGridOutline size={18} /> },
    { name: 'Manage Products', path: '/admincloth/products', icon: <IoShirtOutline size={18} /> },
    { name: 'Manage Categories', path: '/admincloth/categories', icon: <IoLayersOutline size={18} /> },
    { name: 'Manage Orders', path: '/admincloth/orders', icon: <IoReceiptOutline size={18} /> },
    { name: 'Manage Users', path: '/admincloth/users', icon: <IoPeopleOutline size={18} /> },
    { name: 'Coupons & Promos', path: '/admincloth/coupons', icon: <IoGiftOutline size={18} /> },
    { name: 'Hero Slideshow', path: '/admincloth/hero-slides', icon: <IoImagesOutline size={18} /> },
    { name: 'Reviews', path: '/admincloth/reviews', icon: <IoChatbubblesOutline size={18} /> }
  ];

  return (
    <div className="bg-white min-vh-100 pb-5">
      {/* 1. ADMIN TOP NAVBAR */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm mb-4 px-4 bg-navy-gradient border-bottom border-danger border-opacity-25 py-3">
        <Container fluid style={{ maxWidth: '1400px' }}>
          <Navbar.Brand href="/admincloth" className="fw-extrabold d-flex align-items-center gap-2">
            <IoShieldCheckmarkOutline className="text-danger" size={24} />
            <span className="text-white">CUSTOMWEAR <span className="text-danger">BD</span></span>
            <Badge bg="danger" className="ms-2 px-2 py-1 font-monospace" style={{ fontSize: '10px' }}>ADMIN</Badge>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="admin-navbar-nav" />
          
          <Navbar.Collapse id="admin-navbar-nav" className="justify-content-end">
            <Nav className="align-items-center gap-3">
              <NavDropdown 
                title={
                  <span className="text-white fw-bold d-inline-flex align-items-center gap-2">
                    <span className="avatar-circle-sm bg-danger">{user.name.charAt(0).toUpperCase()}</span>
                    <span>Admin Account</span>
                  </span>
                } 
                id="admin-profile-dropdown"
                align="end"
                className="admin-profile-dropdown-nav"
              >
                <div className="px-3 py-2 border-bottom" style={{ minWidth: '220px' }}>
                  <div className="small text-muted">Admin User:</div>
                  <strong className="d-block text-truncate" style={{ fontSize: '13.5px' }}>{user.name}</strong>
                  <span className="small text-muted d-block text-truncate mt-1">{user.email}</span>
                  <Badge bg="danger" className="mt-2 bg-red-gradient uppercase small">{user.role}</Badge>
                </div>
                
                <NavDropdown.Item as={Link} href="/admincloth/change-password" className="d-flex align-items-center gap-2 py-2 text-dark small">
                  <IoShieldCheckmarkOutline size={16} className="text-muted" /> Change Password
                </NavDropdown.Item>
                
                <NavDropdown.Divider />
                
                <NavDropdown.Item onClick={handleAdminLogout} className="d-flex align-items-center gap-2 py-2 text-danger fw-bold small">
                  <IoLogOutOutline size={16} /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* 2. DYNAMIC CONTENT CONTAINER */}
      <Container fluid style={{ maxWidth: '1400px' }}>
        <Row className="gy-4">
          
          {/* LEFT ADMIN NAVIGATION */}
          <Col lg={3}>
            <Card className="custom-card border-0 p-3 shadow-sm bg-white">
              <div className="text-center py-3 border-bottom mb-3">
                <IoShieldCheckmarkOutline className="text-danger mb-2" size={36} />
                <h6 className="fw-bold mb-1">Store Management</h6>
                <Badge bg="danger" className="bg-red-gradient uppercase">{user.role}</Badge>
              </div>

              <ListGroup variant="flush" className="gap-1">
                {adminLinks.map((link) => {
                  const isActive = link.path === '/admincloth' ? pathname === '/admincloth' : pathname.startsWith(link.path);
                  return (
                    <Link key={link.path} href={link.path} passHref legacyBehavior>
                      <ListGroup.Item
                        action
                        className={`d-flex align-items-center gap-3 border-0 rounded-3 py-3 px-3 fw-medium ${isActive ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-dark'}`}
                        style={{ cursor: 'pointer', fontSize: '14px', transition: '0.2s' }}
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

          {/* RIGHT ADMINISTRATIVE DYNAMIC ROUTE */}
          <Col lg={9}>
            <div className="h-100">{children}</div>
          </Col>

        </Row>
      </Container>

      <style>{`
        .avatar-circle-sm {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }
        .bg-navy-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
        }
        .admin-profile-dropdown-nav .dropdown-menu {
          border: 0 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          border-radius: 12px !important;
          margin-top: 10px !important;
        }
      `}</style>
    </div>
  );
}
