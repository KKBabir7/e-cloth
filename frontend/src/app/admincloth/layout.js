'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import BrandLoader from '../../components/BrandLoader';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Card, ListGroup, Badge, Button, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import {
  IoGridOutline, IoShirtOutline, IoReceiptOutline, IoPeopleOutline,
  IoGiftOutline, IoShieldCheckmarkOutline, IoHomeOutline, IoLogOutOutline,
  IoImagesOutline, IoLayersOutline, IoChatbubblesOutline, IoSparklesOutline,
  IoColorPaletteOutline, IoNotificationsOutline, IoCartOutline, IoBrushOutline
} from 'react-icons/io5';
import { logout } from '../../store/authSlice';
import { useUI } from '../../context/UIContext';
import { getBackendUrl } from '../../utils/api';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useUI();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.warn('AudioContext not allowed or supported:', err);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Real-time SSE Order placement listener for admin notifications
  useEffect(() => {
    if (pathname === '/admincloth/login') return;
    if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'superAdmin')) return;

    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || getBackendUrl();
    const es = new EventSource(`${BACKEND}/api/events`);

    const handleUpdate = (e) => {
      try {
        const { type, action, orderId, customerName } = JSON.parse(e.data);
        if (action === 'placed') {
          playNotificationSound();
          if (type === 'orders') {
            const msg = `New Standard Order #${orderId} placed by ${customerName}`;
            showToast(`🔔 ${msg}`, 'success');
            setNotifications(prev => [
              { id: Date.now() + Math.random(), text: msg, time: new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }) },
              ...prev
            ]);
            setUnreadCount(prev => prev + 1);
          } else if (type === 'custom-orders') {
            const msg = `New Custom Order #${orderId} placed`;
            showToast(`🎨 ${msg}`, 'info');
            setNotifications(prev => [
              { id: Date.now() + Math.random(), text: msg, time: new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }) },
              ...prev
            ]);
            setUnreadCount(prev => prev + 1);
          }
        }
      } catch (err) {
        console.error('SSE notification error:', err);
      }
    };

    es.addEventListener('update', handleUpdate);

    return () => {
      es.removeEventListener('update', handleUpdate);
      es.close();
    };
  }, [isAuthenticated, user, pathname]);

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
    return <BrandLoader fullPage={true} transparent={false} />;
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) return null;

  const adminLinks = [
    { name: 'Dashboard Stats', path: '/admincloth', icon: <IoGridOutline size={18} /> },
    { name: 'Manage Products', path: '/admincloth/products', icon: <IoShirtOutline size={18} /> },
    { name: 'Manage Categories', path: '/admincloth/categories', icon: <IoLayersOutline size={18} /> },
    { name: 'Manage Orders', path: '/admincloth/orders', icon: <IoReceiptOutline size={18} /> },
    { name: 'Custom Orders', path: '/admincloth/custom-orders', icon: <IoColorPaletteOutline size={18} /> },
    { name: 'Cart Management', path: '/admincloth/carts', icon: <IoCartOutline size={18} /> },
    { name: 'Saved Designs', path: '/admincloth/saved-designs', icon: <IoBrushOutline size={18} /> },
    { name: 'Manage Users', path: '/admincloth/users', icon: <IoPeopleOutline size={18} /> },
    { name: 'Coupons & Promos', path: '/admincloth/coupons', icon: <IoGiftOutline size={18} /> },
    { name: 'Hero Slideshow', path: '/admincloth/hero-slides', icon: <IoImagesOutline size={18} /> },
    { name: 'Reviews', path: '/admincloth/reviews', icon: <IoChatbubblesOutline size={18} /> },
    { name: 'Design Manage', path: '/admincloth/design-manage', icon: <IoSparklesOutline size={18} /> }
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
              {/* Real-time Notifications Dropdown */}
              <NavDropdown 
                title={
                  <span className="text-white position-relative d-inline-flex align-items-center justify-content-center p-2 rounded-circle hover-bg-navy" style={{ cursor: 'pointer' }}>
                    <IoNotificationsOutline size={20} />
                    {unreadCount > 0 && (
                      <Badge bg="danger" pill className="position-absolute" style={{ top: '0px', right: '0px', fontSize: '9px', padding: '3px 6px' }}>
                        {unreadCount}
                      </Badge>
                    )}
                  </span>
                }
                id="admin-notifications-dropdown"
                align="end"
                className="admin-notifications-dropdown-nav me-1"
                onToggle={(isOpen) => { if (isOpen) setUnreadCount(0); }}
              >
                <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center" style={{ minWidth: '300px' }}>
                  <strong style={{ fontSize: '13px' }}>Notifications</strong>
                  {notifications.length > 0 && (
                    <Button variant="link" className="p-0 text-danger small fw-semibold text-decoration-none" style={{ fontSize: '11px' }} onClick={clearNotifications}>
                      Clear All
                    </Button>
                  )}
                </div>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-muted small">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <NavDropdown.Item key={notif.id} className="py-2.5 border-bottom text-wrap small" style={{ fontSize: '12.5px', whiteSpace: 'normal', maxWidth: '300px' }}>
                        <div className="d-flex align-items-start gap-2">
                          <span className="mt-0.5">🔔</span>
                          <div>
                            <div className="fw-medium text-dark">{notif.text}</div>
                            <span className="text-muted" style={{ fontSize: '10px' }}>{notif.time}</span>
                          </div>
                        </div>
                      </NavDropdown.Item>
                    ))
                  )}
                </div>
              </NavDropdown>

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
