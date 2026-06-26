'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import BrandLoader from '../../components/BrandLoader';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Container, Row, Col } from 'react-bootstrap';
import { IoPersonOutline, IoReceiptOutline, IoColorPaletteOutline, IoChevronForward } from 'react-icons/io5';
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
    return <BrandLoader fullPage={true} transparent={false} />;
  }

  if (!user) return null;

  const sidebarLinks = [
    { name: 'My Profile', desc: 'Personal details & address', path: '/account', icon: <IoPersonOutline size={19} /> },
    { name: 'My Orders', desc: 'Order history & invoices', path: '/account/orders', icon: <IoReceiptOutline size={19} /> },
    { name: 'Saved Designs', desc: 'Your custom creations', path: '/account/designs', icon: <IoColorPaletteOutline size={19} /> }
  ];

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Container className="py-4 py-lg-5 account-page">
      {/* Page Heading */}
      <div className="account-header">
        <span className="account-header-eyebrow">
          <IoPersonOutline size={14} /> My Account
        </span>
        <h1 className="account-header-title">User Dashboard</h1>
        <p className="account-header-sub">
          Manage your profile, track your orders, and revisit your saved designs.
        </p>
      </div>

      <Row className="gy-4">

        {/* LEFT SIDE: ACCOUNT SIDEBAR */}
        <Col lg={3} className="account-sidebar-col">
          <div className="account-profile-card">
            <div className="account-avatar">{initials}</div>
            <div className="account-profile-meta">
              <h5 className="account-profile-name">{user.name}</h5>
              <span className="account-profile-email">{user.email}</span>
              <span className="account-role-badge">{user.role}</span>
            </div>
          </div>

          <nav className="account-nav">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`account-nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="account-nav-icon">{link.icon}</span>
                  <span className="account-nav-text">
                    <span className="account-nav-name">{link.name}</span>
                    <span className="account-nav-desc">{link.desc}</span>
                  </span>
                  <IoChevronForward size={16} className="account-nav-chevron" />
                </Link>
              );
            })}
          </nav>
        </Col>

        {/* RIGHT SIDE: VIEWPORT CHILD PAGE */}
        <Col lg={9}>
          <div className="h-100">{children}</div>
        </Col>

      </Row>
    </Container>
  );
}
