'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Navbar, Nav, NavDropdown, Form, Button, InputGroup, Image } from 'react-bootstrap';
import { IoCart, IoHeart, IoPerson, IoSearch, IoShirtOutline, IoLogOutOutline, IoBagCheckOutline } from 'react-icons/io5';
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

  // ── Categories via React Query ─────────────────────────────────────────
  // GlobalRealtimeSync in Providers.js invalidates ['categories'] via SSE
  // whenever admin adds/edits/deletes — this hook auto-refetches with no
  // extra SSE connection or polling needed here.
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
    <Navbar bg="white" expand="lg" className="sticky-top shadow-sm py-3" style={{ zIndex: 1050 }}>
      <Container>
        {/* Brand Logo */}
        <Link href="/" passHref legacyBehavior>
          <Navbar.Brand className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
            <img 
              src="/logo/udovex.png" 
              alt="Udovex Logo" 
              style={{
                height: '38px',
                width: 'auto',
                display: 'block',
                objectFit: 'contain'
              }}
            />
          </Navbar.Brand>
        </Link>

        <Navbar.Toggle aria-controls="app-navbar-nav" />

        <Navbar.Collapse id="app-navbar-nav">
          <Nav className="me-auto align-items-center gap-2">
            <Link href="/" passHref legacyBehavior>
              <Nav.Link className="fw-medium px-2">Home</Nav.Link>
            </Link>
            
            <NavDropdown title="Shop Category" id="category-nav-dropdown" className="fw-medium px-2">
              {navCategories.map((cat) => (
                <Link key={cat._id || cat.slug} href={`/shop?category=${cat.slug}`} passHref legacyBehavior>
                  <NavDropdown.Item>{cat.name}</NavDropdown.Item>
                </Link>
              ))}
              <NavDropdown.Divider />
              <Link href="/shop" passHref legacyBehavior>
                <NavDropdown.Item>Browse All Shop</NavDropdown.Item>
              </Link>
            </NavDropdown>

            <Link href="/design" passHref legacyBehavior>
              <Nav.Link className="fw-semibold px-2 text-danger animate-pulse d-flex align-items-center gap-1">
                <IoShirtOutline /> Design Studio
              </Nav.Link>
            </Link>
          </Nav>

          {/* Autocomplete Suggestion Search Field */}
          <div className="me-3 position-relative" style={{ width: '320px' }} ref={searchRef}>
            <Form onSubmit={handleSearchSubmit}>
              <InputGroup size="sm">
                <Form.Control
                  type="text"
                  placeholder="Search products..."
                  className="form-control-premium"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                />
                <Button type="submit" variant="dark" style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                  <IoSearch />
                </Button>
              </InputGroup>
            </Form>

            {/* suggestion panel dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="glass-panel position-absolute w-100 mt-2 p-2 shadow-lg" style={{
                zIndex: 1000,
                maxHeight: '350px',
                overflowY: 'auto',
                backgroundColor: 'rgba(255, 255, 255, 0.98)'
              }}>
                {suggestions.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => {
                      router.push(`/product/${product._id}`);
                      setShowSuggestions(false);
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
                      <div className="fw-semibold text-truncate" style={{ fontSize: '13px' }}>{product.name}</div>
                      <div className="text-danger fw-bold" style={{ fontSize: '12px' }}>
                        ৳{product.discountPrice > 0 ? product.discountPrice : product.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Icons */}
          <Nav className="align-items-center gap-3">
            <Link href="/wishlist" passHref legacyBehavior>
              <Nav.Link className="position-relative p-2" title="Wishlist">
                <IoHeart size={24} color="var(--primary-navy)" />
                {mounted && wishlist.length > 0 && (
                  <span className="position-absolute top-0 right-0 badge bg-danger rounded-pill" style={{ fontSize: '9px' }}>
                    {wishlist.length}
                  </span>
                )}
              </Nav.Link>
            </Link>

            <Link href="/cart" passHref legacyBehavior>
              <Nav.Link className="position-relative p-2" title="Cart">
                <IoCart size={24} color="var(--primary-navy)" />
                {mounted && cartCount > 0 && (
                  <span className="position-absolute top-0 right-0 badge bg-danger rounded-pill" style={{ fontSize: '9px' }}>
                    {cartCount}
                  </span>
                )}
              </Nav.Link>
            </Link>

            {/* Auth Dropdowns */}
            {mounted && isAuthenticated ? (
              <NavDropdown
                title={
                  <span className="d-inline-flex align-items-center gap-1 fw-medium text-dark">
                    <IoPerson size={20} />
                    {user?.name.split(' ')[0]}
                  </span>
                }
                id="user-nav-dropdown"
                align="end"
              >
                {/* Admin-only options */}
                {(user?.role === 'admin' || user?.role === 'superAdmin') && (
                  <Link href="/admincloth" passHref legacyBehavior>
                    <NavDropdown.Item className="text-danger fw-bold d-flex align-items-center gap-2">
                      <IoBagCheckOutline /> Admin Control
                    </NavDropdown.Item>
                  </Link>
                )}
                
                <Link href="/account" passHref legacyBehavior>
                  <NavDropdown.Item>My Profile</NavDropdown.Item>
                </Link>
                <Link href="/account/orders" passHref legacyBehavior>
                  <NavDropdown.Item>My Orders</NavDropdown.Item>
                </Link>
                <Link href="/account/designs" passHref legacyBehavior>
                  <NavDropdown.Item>My Custom Designs</NavDropdown.Item>
                </Link>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} className="text-danger d-flex align-items-center gap-2">
                  <IoLogOutOutline /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <div className="d-flex gap-2">
                <Link href="/login" passHref legacyBehavior>
                  <Button variant="outline-dark" size="sm" className="px-3 py-1">Login</Button>
                </Link>
                <Link href="/register" passHref legacyBehavior>
                  <Button variant="danger" size="sm" className="px-3 py-1 bg-red-gradient border-0">Join</Button>
                </Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
      
      {/* Autocomplete hover background overrides */}
      <style>{`
        .hover-bg-light:hover {
          background-color: #F8FAFC;
        }
        .animate-pulse {
          animation: nav-pulse 2s infinite;
        }
        @keyframes nav-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.03); }
        }
      `}</style>
    </Navbar>
  );
}
