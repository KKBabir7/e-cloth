'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Navbar, Nav, NavDropdown, Form, Button, InputGroup, Image, Dropdown, Badge } from 'react-bootstrap';
import { IoShirtOutline, IoLogOutOutline, IoBagCheckOutline } from 'react-icons/io5';
import { FiSearch, FiHeart, FiShoppingCart, FiUser, FiX } from 'react-icons/fi';
import { logout } from '../store/authSlice';
import { useUI } from '../context/UIContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getBackendUrl } from '../utils/api';

export default function AppNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { showToast } = useUI();

  // Hide user navbar in administrative directories
  if (pathname && pathname.startsWith('/admincloth')) {
    return null;
  }
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const wishlist = useSelector((state) => state.wishlist.items);

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 992) {
      setShowDropdown(true);
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 992) {
      setShowDropdown(false);
    }
  };

  const handleToggle = (nextShow, event) => {
    if (event && event.source === 'select') {
      setShowDropdown(false);
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setShowDropdown(nextShow);
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
  const navCategories = categoriesData || [];

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
    }, 300); // 300ms debounce

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      showToast('Successfully logged out', 'info');
      router.push('/login');
    } catch (err) {
      showToast('Logout failed', 'error');
    }
  };

  const cartCount = items.length;

  return (
    <>
      {/* Search Overlay Backdrop & Modal */}
      {showSearchModal && (
        <>
          <div 
            onClick={() => {
              setShowSearchModal(false);
              setSearchTerm('');
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 1090
            }}
          />
          <div 
            className="position-fixed w-100 d-flex align-items-center justify-content-center" 
            style={{
              top: 0,
              left: 0,
              height: '90px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              zIndex: 1100,
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
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    autoFocus
                    style={{ 
                      backgroundColor: '#F3F4F6',
                      border: 'none',
                      color: 'var(--text-dark)',
                      fontSize: '15px',
                      padding: '12px 20px 12px 48px',
                      borderRadius: '30px',
                      height: '48px',
                      width: '100%'
                    }}
                  />
                  <FiSearch 
                    className="position-absolute text-muted" 
                    style={{ left: '18px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px' }} 
                  />
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="glass-panel position-absolute w-100 mt-2 p-2 shadow-lg" style={{
                    zIndex: 1200,
                    maxHeight: '350px',
                    overflowY: 'auto',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(28, 30, 35, 0.08)',
                    borderRadius: '12px'
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
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="object-fit-cover rounded"
                        />
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
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchTerm('');
                }}
                className="text-dark p-2 d-flex align-items-center justify-content-center hover-bg-light rounded-circle text-decoration-none"
                style={{ width: '40px', height: '40px' }}
              >
                <FiX size={24} />
              </Button>
            </Container>
          </div>
        </>
      )}

      <Navbar bg="white" expand="lg" className="sticky-top shadow-sm py-3  transition-smooth" style={{ zIndex: 1050, borderBottom: '1px solid rgba(28, 30, 35, 0.06)' }}>
        <Container>
          {/* Brand Logo */}
          <Link href="/" passHref legacyBehavior>
            <Navbar.Brand className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
              <img 
                src="/logo/udovex.png" 
                alt="Udovex Logo" 
                style={{
                  height: '28px',
                  width: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                  transition: 'transform 0.2s'
                }}
                className="navbar-logo-img"
              />
            </Navbar.Brand>
          </Link>

          <Navbar.Collapse id="app-navbar-nav" className="w-100">
            <Nav className="align-items-center ms-auto mt-3 mt-lg-0" style={{ gap: '35px' }}>
              {/* Group 1: Navigation Links */}
              <div className="d-flex align-items-center" style={{ gap: '35px' }}>
                <Link href="/" passHref legacyBehavior>
                  <Nav.Link className="px-0 py-0 text-hover-orange" style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '0.5px', color: '#475569' }}>Home</Nav.Link>
                </Link>
                
                <NavDropdown 
                  title={<span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '0.5px', color: '#475569' }}>Shop Category</span>} 
                  id="category-nav-dropdown" 
                  className="px-0 py-0 dropdown-premium-hover text-hover-orange"
                  show={showDropdown}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onToggle={handleToggle}
                >
                  {navCategories.map((cat) => (
                    <Link key={cat._id || cat.slug} href={`/shop?category=${cat.slug}`} passHref legacyBehavior>
                      <NavDropdown.Item className="py-2 text-dark" style={{ fontSize: '13px' }}>{cat.name}</NavDropdown.Item>
                    </Link>
                  ))}
                  <NavDropdown.Divider className="border-light opacity-50" />
                  <Link href="/shop" passHref legacyBehavior>
                    <NavDropdown.Item className="py-2 text-dark" style={{ fontSize: '13px' }}>Browse All Shop</NavDropdown.Item>
                  </Link>
                </NavDropdown>
              </div>

              {/* Group 3: Utility Icons */}
              <div className="d-flex align-items-center" style={{ gap: '35px' }}>
                {/* Search Icon Trigger */}
                <Nav.Link 
                  onClick={() => setShowSearchModal(true)} 
                  className="d-flex align-items-center justify-content-center text-hover-orange px-0 py-0 position-relative text-decoration-none" 
                  title="Search"
                  style={{ width: '24px', height: '24px', cursor: 'pointer', color: '#475569' }}
                >
                  <FiSearch size={20} />
                </Nav.Link>

                {/* Wish List Icon */}
                <Link href="/wishlist" passHref legacyBehavior>
                  <Nav.Link className="d-flex align-items-center justify-content-center text-hover-orange px-0 py-0 position-relative text-decoration-none" title="Wishlist" style={{ width: '24px', height: '24px', color: '#475569' }}>
                    <FiHeart size={20} />
                    {mounted && wishlist.length > 0 && (
                      <span 
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white" 
                        style={{ fontSize: '8px', padding: '2px 4px', zIndex: 5, backgroundColor: '#ff8525' }}
                      >
                        {wishlist.length}
                      </span>
                    )}
                  </Nav.Link>
                </Link>

                {/* Cart/Bag Icon */}
                <Link href="/cart" passHref legacyBehavior>
                  <Nav.Link className="d-flex align-items-center justify-content-center text-hover-orange px-0 py-0 position-relative text-decoration-none" title="Cart" style={{ width: '24px', height: '24px', color: '#475569' }}>
                    <FiShoppingCart size={20} />
                    {mounted && cartCount > 0 && (
                      <span 
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white" 
                        style={{ fontSize: '8px', padding: '2px 4px', zIndex: 5, backgroundColor: '#ff8525' }}
                      >
                        {cartCount}
                      </span>
                    )}
                  </Nav.Link>
                </Link>

                {/* Profile Dropdown */}
                <Dropdown align="end" className="d-flex align-items-center">
                  <Dropdown.Toggle as={React.forwardRef(({ children, onClick }, ref) => (
                    <a
                      href=""
                      ref={ref}
                      onClick={(e) => {
                        e.preventDefault();
                        onClick(e);
                      }}
                      className="nav-link d-flex align-items-center justify-content-center text-hover-orange px-0 py-0 text-decoration-none position-relative"
                      style={{ width: '24px', height: '24px', cursor: 'pointer', color: '#475569' }}
                    >
                      <FiUser size={20} />
                    </a>
                  ))} id="profile-dropdown" />

                  <Dropdown.Menu className="shadow-lg border-0 p-3 mt-2" style={{ borderRadius: '12px', minWidth: '240px', backgroundColor: '#FFFFFF' }}>
                    {mounted && isAuthenticated ? (
                      <>
                        <div className="px-2 pb-2 border-bottom mb-2">
                          <div className="small text-muted" style={{ fontSize: '11px' }}>Welcome,</div>
                          <strong className="text-dark text-truncate" style={{ fontSize: '14px' }}>{user?.name}</strong>
                          <span className="small text-muted d-block text-truncate" style={{ fontSize: '11px' }}>{user?.email}</span>
                          {(user?.role === 'admin' || user?.role === 'superAdmin') && (
                            <Badge bg="danger" className="mt-1 bg-red-gradient" style={{ fontSize: '9px' }}>Admin</Badge>
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
                        <div className="px-2 pb-2 border-bottom mb-2">
                          <div className="small text-muted" style={{ fontSize: '11px', marginBottom: '2px' }}>Welcome</div>
                          <div className="d-flex align-items-center gap-2" style={{ fontSize: '13.5px' }}>
                            <Link href="/login" className="fw-bold text-decoration-none" style={{ color: '#ff8525' }}>Sign in</Link>
                            <span className="text-muted">/</span>
                            <Link href="/register" className="fw-bold text-decoration-none" style={{ color: '#ff8525' }}>Sign up</Link>
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

              {/* Group 2: CTA Button (Design Studio at the far right) */}
              <Link href="/design" passHref legacyBehavior>
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="px-3 py-1.5 fw-bold text-white d-inline-flex align-items-center gap-1 border-0 pulse-btn"
                  style={{ borderRadius: '6px', fontSize: '13px', backgroundColor: '#ff8525', letterSpacing: '0.5px' }}
                >
                  <IoShirtOutline size={14} /> Design Studio
                </Button>
              </Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      
      <style>{`
        .text-hover-orange {
          transition: color 0.25s ease !important;
        }
        .text-hover-orange:hover, .text-hover-orange:focus {
          color: var(--accent-red) !important;
        }
        .nav-action-label {
          color: #475569;
          transition: color 0.25s ease;
        }
        .text-hover-orange:hover .nav-action-label {
          color: var(--accent-red) !important;
        }
        .hover-bg-light:hover {
          background-color: #F8FAFC !important;
        }
        .dropdown-menu {
          background-color: #FFFFFF !important;
          border: 1px solid rgba(28, 30, 35, 0.08) !important;
          box-shadow: var(--card-shadow) !important;
        }
        .dropdown-menu .dropdown-item {
          color: var(--text-dark) !important;
          transition: all 0.2s ease !important;
        }
        .dropdown-menu .dropdown-item:hover {
          background-color: var(--accent-red) !important;
          color: #FFFFFF !important;
        }
        .navbar-logo-img:hover {
          transform: none;
        }
        /* Custom dropdown toggle styling */
        #profile-dropdown::after {
          display: none !important;
        }
        .dropdown-premium-hover .nav-link,
        .dropdown-premium-hover .dropdown-toggle {
          padding-left: 0 !important;
          padding-right: 0 !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
        /* Responsive Shop Category Dropdown and animated caret */
        @media (min-width: 992px) {
          .dropdown-premium-hover:hover .dropdown-menu {
            display: block !important;
            margin-top: 0;
          }
        }
        .dropdown-premium-hover .dropdown-toggle::after {
          margin-left: 6px;
          vertical-align: middle;
          border-top: 4px solid;
          border-right: 4px solid transparent;
          border-left: 4px solid transparent;
          transition: transform 0.2s ease;
          display: inline-block !important;
        }
        .dropdown-premium-hover:hover .dropdown-toggle::after,
        .dropdown-premium-hover.show .dropdown-toggle::after {
          transform: rotate(180deg);
        }
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes pulse-glow {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 133, 37, 0.45);
          }
          70% {
            transform: scale(1.04);
            box-shadow: 0 0 0 6px rgba(255, 133, 37, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 133, 37, 0);
          }
        }
        .pulse-btn {
          animation: pulse-glow 2s infinite ease-in-out;
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
      `}</style>
    </Navbar>
   </>
  );
}
