'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Navbar, Nav, NavDropdown, Form, Button, Image, Dropdown, Badge, Offcanvas, Accordion } from 'react-bootstrap';
import { IoShirtOutline, IoLogOutOutline, IoBagCheckOutline } from 'react-icons/io5';
import { FiSearch, FiHeart, FiShoppingCart, FiUser, FiX, FiChevronDown, FiMenu, FiHome, FiGrid, FiShoppingBag } from 'react-icons/fi';
import { logout } from '../store/authSlice';
import { useUI } from '../context/UIContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getBackendUrl } from '../utils/api';

export default function AppNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const isHomePage = pathname === '/';
  const designStudioNavClass = `btn-design-studio-nav border-0${isHomePage ? ' btn-design-studio-nav--home-pulse' : ''}`;
  const { showToast } = useUI();

  // ── All hooks must be called unconditionally before any early return ──
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const wishlist = useSelector((state) => state.wishlist.items);

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
 
  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setShowDropdown(true);
    }
  };
 
  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setShowDropdown(false);
    }
  };
 
  const handleToggle = (nextShow, event) => {
    if (event && event.source === 'select') {
      setShowDropdown(false);
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowDropdown(nextShow);
    }
  };

  const handleProfileMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setShowProfileDropdown(true);
    }
  };

  const handleProfileMouseLeave = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setShowProfileDropdown(false);
    }
  };

  const handleProfileToggle = (nextShow, event) => {
    if (event && event.source === 'select') {
      setShowProfileDropdown(false);
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowProfileDropdown(nextShow);
    }
  };

  // ── Categories via React Query ─────────────────────────────────────────
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/categories`);
        if (res.data.success) return res.data.categories;
        return [];
      } catch {
        return [];
      }
    }
  });


  const navCategories = (categoriesData && categoriesData.length > 0) ? categoriesData : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounced Instant suggestions
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/products?search=${searchTerm}&limit=5`);
        if (res.data.success) {
          setSuggestions(res.data.products);
        }
      } catch (err) {
        console.error('Autocomplete query error:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Click outside search listener to close autocomplete suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide user navbar in administrative directories (must be AFTER all hooks)
  if (pathname && pathname.startsWith('/admincloth')) {
    return null;
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
      setShowOffcanvas(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      showToast('Successfully logged out', 'info');
      router.push('/login');
      setShowOffcanvas(false);
    } catch (err) {
      showToast('Logout failed', 'error');
    }
  };

  const cartCount = items.length;

  // Helper to capitalize category name
  const capName = (name) =>
    name ? name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';

  return (
    <>
      {/* ── Search Overlay ───────────────────────────────────────────────── */}
      {showSearchModal && (
        <>
          <div 
            onClick={() => { setShowSearchModal(false); setSearchTerm(''); }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1090
            }}
          />
          <div 
            className="position-fixed w-100 d-flex align-items-center justify-content-center" 
            style={{
              top: 0, left: 0, height: '90px', backgroundColor: '#FFFFFF',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', zIndex: 1100,
              animation: 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Container className="d-flex align-items-center gap-3">
              <Form onSubmit={handleSearchSubmit} className="flex-grow-1 position-relative" ref={searchRef}>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    autoFocus
                    style={{ 
                      backgroundColor: '#F3F4F6', border: 'none', color: 'var(--text-dark)',
                      fontSize: '15px', padding: '12px 20px 12px 48px', borderRadius: '30px', height: '48px', width: '100%'
                    }}
                  />
                  <FiSearch className="position-absolute text-muted" style={{ left: '18px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px' }} />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="glass-panel position-absolute w-100 mt-2 p-2 shadow-lg" style={{
                    zIndex: 1200, maxHeight: '350px', overflowY: 'auto',
                    backgroundColor: '#FFFFFF', border: '1px solid rgba(28, 30, 35, 0.08)', borderRadius: '12px'
                  }}>
                    {suggestions.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => {
                          router.push(`/product/${product._id}`);
                          setShowSuggestions(false);
                          setShowSearchModal(false);
                          setSearchTerm('');
                        }}
                        className="d-flex align-items-center gap-2 p-2 hover-bg-light rounded"
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      >
                        <Image src={product.images[0]} alt={product.name} width={40} height={40} className="object-fit-cover rounded" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="fw-semibold text-truncate text-dark" style={{ fontSize: '13px' }}>{product.name}</div>
                          <div className="fw-bold" style={{ fontSize: '12px', color: 'var(--accent-red)' }}>
                            ৳{product.discountPrice > 0 ? product.discountPrice : product.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Form>
              <Button 
                variant="link" 
                onClick={() => { setShowSearchModal(false); setSearchTerm(''); }}
                className="text-dark p-2 d-flex align-items-center justify-content-center hover-bg-light rounded-circle text-decoration-none"
                style={{ width: '40px', height: '40px' }}
              >
                <FiX size={24} />
              </Button>
            </Container>
          </div>
        </>
      )}

      {/* ── Main Navbar ──────────────────────────────────────────────────── */}
      <Navbar bg="white" className="sticky-top shadow-sm py-3 transition-smooth" style={{ zIndex: 1030, borderBottom: '1px solid rgba(28, 30, 35, 0.06)' }}>
        <Container>
          {/* Brand Logo */}
          <Link href="/" passHref legacyBehavior>
            <Navbar.Brand className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
              <img
                src="/logo/udovex.png"
                alt="Udovex Logo"
                style={{ width: 'auto', display: 'block', objectFit: 'contain', transition: 'transform 0.2s' }}
                className="navbar-logo-img"
              />
            </Navbar.Brand>
          </Link>

          {/* ── DESKTOP NAV (hidden on mobile) ────────────────────────── */}
          <Nav className="align-items-center ms-auto d-none d-md-flex desktop-nav-container">
            {/* Design Studio CTA */}
            <Link href="/design" passHref legacyBehavior>
              <Button
                variant="danger"
                size="sm"
                className={designStudioNavClass}
              >
                <IoShirtOutline size={14} /> Design Studio
              </Button>
            </Link>

            {/* Nav Links */}
            <div className="d-flex align-items-center desktop-nav-links">
              <Link href="/" passHref legacyBehavior>
                <Nav.Link className="px-0 py-0 text-hover-orange" style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '0.5px', color: '#475569' }}>Home</Nav.Link>
              </Link>
              
              <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="dropdown-premium-hover d-flex align-items-center">
                <NavDropdown 
                  title={
                    <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '0.5px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      Shop Category
                      <FiChevronDown size={14} className="category-caret-icon" style={{ transition: 'transform 0.25s ease', marginTop: '1px' }} />
                    </span>
                  } 
                  id="category-nav-dropdown" 
                  className="px-0 py-0 text-hover-orange"
                  show={showDropdown}
                  onToggle={handleToggle}
                >
                  {navCategories.map((cat) => (
                    <Link key={cat._id || cat.slug} href={`/shop?category=${cat.slug}`} passHref legacyBehavior>
                      <NavDropdown.Item className="py-2 text-dark" style={{ fontSize: '13.5px' }}>
                        {capName(cat.name)}
                      </NavDropdown.Item>
                    </Link>
                  ))}
                  <NavDropdown.Divider className="border-light opacity-50" />
                  <Link href="/shop" passHref legacyBehavior>
                    <NavDropdown.Item className="py-2 text-dark" style={{ fontSize: '13.5px' }}>Browse All Shop</NavDropdown.Item>
                  </Link>
                </NavDropdown>
              </div>
            </div>

            {/* Utility Icons */}
            <div className="d-flex align-items-center desktop-utility-icons">
              <Nav.Link onClick={() => setShowSearchModal(true)} className="d-flex align-items-center justify-content-center text-hover-orange px-0 py-0 position-relative text-decoration-none" title="Search" style={{ width: '24px', height: '24px', cursor: 'pointer', color: '#475569' }}>
                <FiSearch size={20} />
              </Nav.Link>

              <Link href="/wishlist" passHref legacyBehavior>
                <Nav.Link className="d-flex align-items-center justify-content-center text-hover-orange px-0 py-0 position-relative text-decoration-none" title="Wishlist" style={{ width: '24px', height: '24px', color: '#475569' }}>
                  <FiHeart size={20} />
                  {mounted && wishlist.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill border border-white" style={{ fontSize: '8.5px', padding: '2.5px 5px', zIndex: 5, backgroundColor: '#ff8525', color: '#ffffff', fontWeight: 'bold' }}>
                      {wishlist.length}
                    </span>
                  )}
                </Nav.Link>
              </Link>

              <Link href="/cart" passHref legacyBehavior>
                <Nav.Link className="d-flex align-items-center justify-content-center text-hover-orange px-0 py-0 position-relative text-decoration-none" title="Cart" style={{ width: '24px', height: '24px', color: '#475569' }}>
                  <FiShoppingCart size={20} />
                  {mounted && cartCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill border border-white" style={{ fontSize: '8.5px', padding: '2.5px 5px', zIndex: 5, backgroundColor: '#ff8525', color: '#ffffff', fontWeight: 'bold' }}>
                      {cartCount}
                    </span>
                  )}
                </Nav.Link>
              </Link>

              {/* Profile Dropdown */}
              <div onMouseEnter={handleProfileMouseEnter} onMouseLeave={handleProfileMouseLeave} className="d-flex align-items-center dropdown-profile-hover">
                <Dropdown align="end" show={showProfileDropdown} onToggle={handleProfileToggle}>
                  <Dropdown.Toggle as={React.forwardRef(({ children, onClick }, ref) => (
                    <a href="" ref={ref} onClick={(e) => { e.preventDefault(); onClick(e); }}
                      className="nav-link d-flex align-items-center justify-content-center text-hover-orange px-0 py-0 text-decoration-none position-relative"
                      style={{ width: '24px', height: '24px', cursor: 'pointer', color: '#475569' }}>
                      <FiUser size={20} />
                    </a>
                  ))} id="profile-dropdown" />

                  <Dropdown.Menu className="shadow-lg border-0 p-3 mt-2" style={{ borderRadius: '12px', minWidth: '240px', backgroundColor: '#FFFFFF' }}>
                    {mounted && isAuthenticated ? (
                      <>
                        <div className="px-3 py-2 border-bottom mb-2 bg-light rounded-3" style={{ border: '1px solid rgba(0,0,0,0.03)' }}>
                          <div className="small text-muted text-uppercase fw-semibold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Logged In As</div>
                          <strong className="text-dark text-truncate d-block" style={{ fontSize: '14px', fontWeight: 600 }}>{user?.name}</strong>
                          <span className="small text-muted d-block text-truncate" style={{ fontSize: '11px' }}>{user?.email}</span>
                          {(user?.role === 'admin' || user?.role === 'superAdmin') && (
                            <Badge bg="danger" className="mt-1 px-2 bg-red-gradient" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Admin</Badge>
                          )}
                        </div>
                        {(user?.role === 'admin' || user?.role === 'superAdmin') && (
                          <Link href="/admincloth" passHref legacyBehavior>
                            <Dropdown.Item className="d-flex align-items-center gap-2 py-2 text-danger fw-bold rounded-2" style={{ fontSize: '13px' }}>
                              <IoBagCheckOutline size={16} /> Admin Control
                            </Dropdown.Item>
                          </Link>
                        )}
                        <Link href="/account" passHref legacyBehavior>
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-2 rounded-2 text-dark" style={{ fontSize: '13px' }}>
                            <FiUser size={16} className="text-muted" /> My Profile
                          </Dropdown.Item>
                        </Link>
                        <Link href="/account/orders" passHref legacyBehavior>
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-2 rounded-2 text-dark" style={{ fontSize: '13px' }}>
                            <IoBagCheckOutline size={16} className="text-muted" /> My Orders
                          </Dropdown.Item>
                        </Link>
                        <Link href="/account/designs" passHref legacyBehavior>
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-2 rounded-2 text-dark" style={{ fontSize: '13px' }}>
                            <IoShirtOutline size={16} className="text-muted" /> My Custom Designs
                          </Dropdown.Item>
                        </Link>
                        <Dropdown.Divider className="opacity-50" />
                        <Dropdown.Item onClick={handleLogout} className="d-flex align-items-center gap-2 py-2 rounded-2 text-danger fw-bold" style={{ fontSize: '13px' }}>
                          <IoLogOutOutline size={16} /> Logout
                        </Dropdown.Item>
                      </>
                    ) : (
                      <>
                        <div className="px-3 py-2 border-bottom mb-2 bg-light rounded-3" style={{ border: '1px solid rgba(0,0,0,0.03)' }}>
                          <div className="small text-muted text-uppercase fw-semibold" style={{ fontSize: '10px', letterSpacing: '0.5px', marginBottom: '4px' }}>Welcome To Udovex</div>
                          <div className="d-flex align-items-center gap-2 mt-1" style={{ fontSize: '13.5px' }}>
                            <Link href="/login" passHref legacyBehavior><a className="fw-bold text-decoration-none" style={{ color: '#ff8525' }}>Sign In</a></Link>
                            <span className="text-muted">/</span>
                            <Link href="/register" passHref legacyBehavior><a className="fw-bold text-decoration-none" style={{ color: '#ff8525' }}>Sign Up</a></Link>
                          </div>
                        </div>
                        <Link href="/login" passHref legacyBehavior>
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-2 rounded-2 text-dark" style={{ fontSize: '13px' }}>
                            <IoBagCheckOutline size={16} className="text-muted" /> Track Order
                          </Dropdown.Item>
                        </Link>
                        <Link href="/design" passHref legacyBehavior>
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-2 rounded-2 text-dark" style={{ fontSize: '13px' }}>
                            <IoShirtOutline size={16} className="text-muted" /> Design Studio
                          </Dropdown.Item>
                        </Link>
                        <Link href="/about" passHref legacyBehavior>
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-2 rounded-2 text-dark" style={{ fontSize: '13px' }}>
                            <FiUser size={16} className="text-muted" /> About Us
                          </Dropdown.Item>
                        </Link>
                      </>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </Nav>

          {/* ── MOBILE RIGHT ICONS + HAMBURGER (hidden on desktop) ──────── */}
          <div className="d-flex d-md-none align-items-center ms-auto" style={{ gap: '14px' }}>
            {/* Design Studio compact button */}
            <Link href="/design" passHref legacyBehavior>
              <a className={`btn-design-studio-nav btn-design-studio-nav--compact text-decoration-none${isHomePage ? ' btn-design-studio-nav--home-pulse' : ''}`}>
                <IoShirtOutline size={12} style={{ display: 'inline-block' }} />
                <span>Design</span>
              </a>
            </Link>

            {/* Search */}
            <button onClick={() => setShowSearchModal(true)} className="btn p-0 border-0 bg-transparent d-flex align-items-center" style={{ color: '#475569' }}>
              <FiSearch size={18} />
            </button>

            {/* Cart */}
            <Link href="/cart" passHref legacyBehavior>
              <a className="position-relative d-flex align-items-center" style={{ color: '#475569', lineHeight: 1 }}>
                <FiShoppingCart size={18} />
                {mounted && cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill border border-white" style={{ fontSize: '8px', padding: '2px 4.5px', zIndex: 5, backgroundColor: '#ff8525', color: '#fff', fontWeight: 'bold' }}>
                    {cartCount}
                  </span>
                )}
              </a>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setShowOffcanvas(true)}
              className="btn p-0 border-0 bg-transparent d-flex align-items-center justify-content-center offcanvas-hamburger"
              style={{ color: '#1c1e23', width: '30px', height: '30px' }}
              aria-label="Open menu"
            >
              <FiMenu size={21} />
            </button>
          </div>
        </Container>
      </Navbar>

      {/* ── MOBILE OFFCANVAS SIDEBAR ─────────────────────────────────────── */}
      <Offcanvas 
        show={showOffcanvas} 
        onHide={() => setShowOffcanvas(false)} 
        placement="end"
        style={{ width: '300px', '--bs-offcanvas-width': '300px' }}
        className="offcanvas-sidebar"
      >
        <Offcanvas.Header className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <Link href="/" passHref legacyBehavior>
            <a onClick={() => setShowOffcanvas(false)}>
              <img src="/logo/udovex.png" alt="Udovex" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
            </a>
          </Link>
          <button
            onClick={() => setShowOffcanvas(false)}
            className="btn p-1 border-0 bg-transparent d-flex align-items-center justify-content-center"
            style={{ color: '#64748b', borderRadius: '8px', width: '32px', height: '32px' }}
          >
            <FiX size={20} />
          </button>
        </Offcanvas.Header>

        <Offcanvas.Body className="px-0 py-0 d-flex flex-column" style={{ overflowY: 'auto' }}>
          {/* User greeting */}
          {mounted && (
            <div className="px-4 py-3" style={{ backgroundColor: '#FFF7ED', borderBottom: '1px solid #FED7AA' }}>
              {isAuthenticated ? (
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ff8525', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiUser size={18} color="#fff" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="fw-bold text-truncate" style={{ fontSize: '14px', color: '#1c1e23' }}>{user?.name}</div>
                    <div className="text-truncate" style={{ fontSize: '11px', color: '#64748b' }}>{user?.email}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Welcome to Udovex</div>
                  <div className="d-flex gap-2">
                    <Link href="/login" passHref legacyBehavior>
                      <a onClick={() => setShowOffcanvas(false)} className="btn btn-sm fw-bold text-white border-0 flex-fill text-center" style={{ backgroundColor: '#ff8525', borderRadius: '8px', fontSize: '13px', padding: '6px' }}>
                        Sign In
                      </a>
                    </Link>
                    <Link href="/register" passHref legacyBehavior>
                      <a onClick={() => setShowOffcanvas(false)} className="btn btn-sm fw-bold border-0 flex-fill text-center" style={{ backgroundColor: '#fff', color: '#ff8525', border: '1.5px solid #ff8525 !important', borderRadius: '8px', fontSize: '13px', padding: '6px' }}>
                        Sign Up
                      </a>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-3 py-3 flex-grow-1">
            {/* Home */}
            <Link href="/" passHref legacyBehavior>
              <a onClick={() => setShowOffcanvas(false)} className="d-flex align-items-center gap-3 px-3 py-2 mb-1 text-decoration-none offcanvas-nav-link" style={{ borderRadius: '10px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                <FiHome size={17} style={{ color: '#94a3b8' }} /> Home
              </a>
            </Link>

            {/* Shop Category Accordion */}
            <Accordion flush>
              <Accordion.Item eventKey="0" style={{ border: 'none', background: 'transparent' }}>
                <Accordion.Header style={{ padding: 0 }}>
                  <span className="d-flex align-items-center gap-3 w-100" style={{ color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                    <FiGrid size={17} style={{ color: '#94a3b8' }} /> Shop Category
                  </span>
                </Accordion.Header>
                <Accordion.Body style={{ padding: '4px 0 4px 44px' }}>
                  {navCategories.map((cat) => (
                    <Link key={cat._id || cat.slug} href={`/shop?category=${cat.slug}`} passHref legacyBehavior>
                      <a onClick={() => setShowOffcanvas(false)} className="d-block py-2 px-3 mb-1 text-decoration-none offcanvas-nav-link" style={{ borderRadius: '8px', color: '#64748b', fontSize: '13.5px' }}>
                        {capName(cat.name)}
                      </a>
                    </Link>
                  ))}
                  <Link href="/shop" passHref legacyBehavior>
                    <a onClick={() => setShowOffcanvas(false)} className="d-block py-2 px-3 text-decoration-none fw-semibold" style={{ borderRadius: '8px', color: '#ff8525', fontSize: '13px' }}>
                      Browse All Shop →
                    </a>
                  </Link>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            <Link href="/shop" passHref legacyBehavior>
              <a onClick={() => setShowOffcanvas(false)} className="d-flex align-items-center gap-3 px-3 py-2 mb-1 text-decoration-none offcanvas-nav-link" style={{ borderRadius: '10px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                <FiShoppingBag size={17} style={{ color: '#94a3b8' }} /> Shop
              </a>
            </Link>

            {/* Wishlist - visible to all users */}
            <Link href="/wishlist" passHref legacyBehavior>
              <a onClick={() => setShowOffcanvas(false)} className="d-flex align-items-center justify-content-between px-3 py-2 mb-1 text-decoration-none offcanvas-nav-link" style={{ borderRadius: '10px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                <span className="d-flex align-items-center gap-3">
                  <FiHeart size={17} style={{ color: '#94a3b8' }} /> Wishlist
                </span>
                {mounted && wishlist.length > 0 && (
                  <span style={{ backgroundColor: '#ff8525', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '20px', padding: '1px 7px', minWidth: '20px', textAlign: 'center' }}>
                    {wishlist.length}
                  </span>
                )}
              </a>
            </Link>

            <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '8px 0' }} />

            {/* Account links */}
            {mounted && isAuthenticated ? (
              <>
                <Link href="/account" passHref legacyBehavior>
                  <a onClick={() => setShowOffcanvas(false)} className="d-flex align-items-center gap-3 px-3 py-2 mb-1 text-decoration-none offcanvas-nav-link" style={{ borderRadius: '10px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                    <FiUser size={17} style={{ color: '#94a3b8' }} /> My Profile
                  </a>
                </Link>
                <Link href="/account/orders" passHref legacyBehavior>
                  <a onClick={() => setShowOffcanvas(false)} className="d-flex align-items-center gap-3 px-3 py-2 mb-1 text-decoration-none offcanvas-nav-link" style={{ borderRadius: '10px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                    <IoBagCheckOutline size={17} style={{ color: '#94a3b8' }} /> My Orders
                  </a>
                </Link>
                <Link href="/account/designs" passHref legacyBehavior>
                  <a onClick={() => setShowOffcanvas(false)} className="d-flex align-items-center gap-3 px-3 py-2 mb-1 text-decoration-none offcanvas-nav-link" style={{ borderRadius: '10px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                    <IoShirtOutline size={17} style={{ color: '#94a3b8' }} /> My Designs
                  </a>
                </Link>
                {(user?.role === 'admin' || user?.role === 'superAdmin') && (
                  <Link href="/admincloth" passHref legacyBehavior>
                    <a onClick={() => setShowOffcanvas(false)} className="d-flex align-items-center gap-3 px-3 py-2 mb-1 text-decoration-none fw-bold" style={{ borderRadius: '10px', color: '#ef4444', fontSize: '14px' }}>
                      <IoBagCheckOutline size={17} /> Admin Control
                    </a>
                  </Link>
                )}

                <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '8px 0' }} />

                <button onClick={handleLogout} className="d-flex align-items-center gap-3 px-3 py-2 w-100 border-0 bg-transparent fw-bold text-start" style={{ borderRadius: '10px', color: '#ef4444', fontSize: '14px', cursor: 'pointer' }}>
                  <IoLogOutOutline size={17} /> Logout
                </button>
              </>
            ) : (
              <></>
            )}
          </nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
