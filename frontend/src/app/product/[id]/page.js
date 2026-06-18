'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { Container, Row, Col, Button, Badge, Form, Accordion } from 'react-bootstrap';
import {
  IoCart, IoHeartOutline, IoHeart, IoCarOutline,
  IoShieldCheckmarkOutline, IoLogoFacebook, IoLogoInstagram,
  IoChevronForward, IoStarSharp, IoShareSocialOutline,
  IoCheckmarkCircle, IoReturnDownBack, IoTimeOutline,
  IoScanOutline, IoColorPaletteOutline
} from 'react-icons/io5';
import { FaXTwitter, FaPinterest } from 'react-icons/fa6';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../../../store/wishlistSlice';
import { addToCart } from '../../../store/cartSlice';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getBackendUrl, getProductImageUrl } from '@/utils/api';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const { showToast } = useUI();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);

  const [mounted, setMounted] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') setShareUrl(window.location.href);
  }, []);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ display: 'none' });
  const [activeTab, setActiveTab] = useState('reviews');
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reviews
  const [reviewSort, setReviewSort] = useState('newest');
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const { data: product, isLoading, refetch } = useQuery({
    queryKey: ['product', params.id],
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/products/${params.id}`);
        if (res.data.success) return res.data.product;
        throw new Error('Not successful');
      } catch (err) {
        console.warn('Backend server unseeded or offline', err);
        return null;
      }
    },
    enabled: !!params.id
  });

  useEffect(() => {
    if (!product?._id) return;

    const matchingItems = cartItems.filter(
      (item) =>
        item.productId?.toString() === product._id.toString() &&
        !item.isCustom
    );
    const cartItem = matchingItems[matchingItems.length - 1];

    if (cartItem) {
      if (cartItem.size) setSelectedSize(cartItem.size);
      if (cartItem.color) {
        setSelectedColor(cartItem.color);
        const colorImgs = product.colorImages || {};
        const mappedImg = colorImgs[cartItem.color];
        if (mappedImg) {
          const imgIndex = product.images.indexOf(mappedImg);
          setActiveImageIdx(imgIndex >= 0 ? imgIndex : 0);
        }
      }
      if (cartItem.quantity) setQuantity(cartItem.quantity);
      return;
    }

    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setActiveImageIdx(0);
  }, [product?._id, cartItems]);

  const handleZoomMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${getProductImageUrl(product.images[activeImageIdx])})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '220%'
    });
  };

  const handleZoomLeave = () => setZoomStyle({ display: 'none' });

  const handleToggleWishlist = () => {
    dispatch(toggleWishlist({
      id: product._id,
      name: product.name,
      price: product.discountPrice > 0 ? product.discountPrice : product.price,
      image: product.images[0]
    }));
    showToast('Wishlist updated!', 'info');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) {
      showToast('Please fill out all review fields!', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/products/${product._id}/reviews`, {
        name: newReviewName,
        rating: newReviewRating,
        comment: newReviewComment
      });
      if (res.data.success) {
        showToast('Thank you! Your review has been published.', 'success');
        setNewReviewName('');
        setNewReviewComment('');
        setNewReviewRating(5);
        refetch();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const sortedReviews = [...(product?.reviews || [])].sort((a, b) => {
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const handleAddToCart = (redirectCheckout = false) => {
    if (product.variants?.colors?.length > 0 && !selectedColor) {
      showToast('Please select a color variant first!', 'error');
      return;
    }
    if (product.variants?.sizes?.length > 0 && !selectedSize) {
      showToast('Please select a size variant first!', 'error');
      return;
    }
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.discountPrice > 0 ? product.discountPrice : product.price,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
      quantity,
      isCustom: false
    }));
    showToast(`${product.name} added to cart!`, 'success');
    if (redirectCheckout) router.push('/checkout');
  };

  const isInWishlist = () => wishlistItems.some((item) => item.id === product?._id);
  const displayPrice = product ? (product.discountPrice > 0 ? product.discountPrice : product.price) : 0;

  const handleTryOn = () => {
    if (!product?._id) return;
    router.push(`/design?productId=${product._id}`);
  };

  const getShareUrl = () => shareUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const handleInstagramShare = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      showToast('Link copied! Paste it in your Instagram post or story.', 'success');
    } catch {
      showToast('Could not copy link', 'error');
    }
    setShareOpen(false);
  };

  const shareLinks = [
    {
      key: 'facebook',
      label: 'Facebook',
      icon: <IoLogoFacebook size={17} />,
      className: 'product-share-item--facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`,
    },
    {
      key: 'x',
      label: 'X',
      icon: <FaXTwitter size={15} />,
      className: 'product-share-item--x',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(product?.name || '')}`,
    },
    {
      key: 'instagram',
      label: 'Instagram',
      icon: <IoLogoInstagram size={17} />,
      className: 'product-share-item--instagram',
      onClick: handleInstagramShare,
    },
    {
      key: 'pinterest',
      label: 'Pinterest',
      icon: <FaPinterest size={15} />,
      className: 'product-share-item--pinterest',
      href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(getShareUrl())}&description=${encodeURIComponent(product?.name || '')}`,
    },
  ];

  /* ── SKELETON LOADER ── */
  if (isLoading) {
    return (
      <Container className="py-5">
        {/* Breadcrumb skeleton */}
        <div className="skeleton mb-4" style={{ height: '16px', width: '260px', borderRadius: '6px' }} />
        <Row className="gy-5">
          <Col lg={6}>
            <div className="skeleton rounded-4 mb-3" style={{ height: '500px' }} />
            <div className="d-flex gap-3">
              {[1,2,3,4].map(i => <div key={i} className="skeleton rounded-3" style={{ height: '86px', width: '86px' }} />)}
            </div>
          </Col>
          <Col lg={6}>
            <div className="skeleton mb-3" style={{ height: '18px', width: '90px', borderRadius: '20px' }} />
            <div className="skeleton mb-3" style={{ height: '36px', width: '80%', borderRadius: '8px' }} />
            <div className="skeleton mb-4" style={{ height: '18px', width: '40%' }} />
            <div className="skeleton mb-4" style={{ height: '72px', borderRadius: '12px' }} />
            <div className="skeleton mb-4" style={{ height: '44px', width: '50%' }} />
            <div className="skeleton mb-4" style={{ height: '44px', borderRadius: '12px' }} />
            <div className="d-flex gap-3">
              <div className="skeleton flex-grow-1" style={{ height: '54px', borderRadius: '12px' }} />
              <div className="skeleton flex-grow-1" style={{ height: '54px', borderRadius: '12px' }} />
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!product) return (
    <Container className="py-5 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <div style={{ fontSize: '64px' }}>😔</div>
        <h4 className="fw-bold mt-3" style={{ color: 'var(--primary-navy)' }}>Product Not Found</h4>
        <p className="text-muted mb-4">This product may have been removed or is temporarily unavailable.</p>
        <Link href="/shop"><Button className="btn-premium-accent border-0 text-white rounded-3 fw-bold px-4 py-2">Browse All Products</Button></Link>
      </div>
    </Container>
  );

  const TABS = [
    { key: 'reviews', label: `Reviews (${product.ratings?.count || 0})` },
    { key: 'shipping', label: 'Shipping & Returns' },
    { key: 'size-guide', label: 'Size Guide' },
  ];

  return (
    <div style={{ backgroundColor: '#FAFBFC', minHeight: '100vh' }}>
      <Container className="py-4">

        {/* ── BREADCRUMB ── */}
        <nav className="d-flex align-items-center gap-1 mb-4" style={{ fontSize: '13px', color: '#64748B' }}>
          <Link href="/" className="text-decoration-none" style={{ color: '#64748B' }}>Home</Link>
          <IoChevronForward size={13} />
          <Link href="/shop" className="text-decoration-none" style={{ color: '#64748B' }}>Shop</Link>
          <IoChevronForward size={13} />
          <span style={{ color: 'var(--primary-navy)', fontWeight: 600 }} className="text-truncate" title={product.name}>{product.name}</span>
        </nav>

        <Row className="gy-5 align-items-start">

          {/* ── LEFT: IMAGE GALLERY ── */}
          <Col lg={6}>
            <div className="d-flex flex-column gap-3" style={{ position: 'sticky', top: '90px' }}>

              {/* Main Image + Zoom */}
              <div
                className="position-relative overflow-hidden bg-white"
                style={{
                  height: '500px',
                  borderRadius: '20px',
                  border: '1px solid #E8EDF2',
                  boxShadow: '0 8px 40px rgba(15,23,42,0.06)',
                  cursor: 'zoom-in'
                }}
                onMouseMove={handleZoomMove}
                onMouseLeave={handleZoomLeave}
              >
                <Image
                  src={getProductImageUrl(product.images[activeImageIdx])}
                  alt={product.name}
                  className="w-100 h-100"
                  width={900}
                  height={900}
                  sizes="(max-width: 992px) 100vw, 50vw"
                  unoptimized
                  style={{ objectFit: 'contain', transition: 'opacity 0.3s' }}
                />

                {/* Zoom overlay */}
                <div
                  className="position-absolute w-100 h-100"
                  style={{ top: 0, left: 0, pointerEvents: 'none', ...zoomStyle, backgroundColor: '#fff', zIndex: 5 }}
                />

                {/* Out of stock overlay */}
                {product.stock === 0 && (
                  <div
                    className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ top: 0, left: 0, backgroundColor: 'rgba(255,255,255,0.75)', zIndex: 7, backdropFilter: 'blur(2px)' }}
                  >
                    <span className="fw-bold px-4 py-2 rounded-3 text-white" style={{ backgroundColor: '#1E293B', fontSize: '14px', letterSpacing: '1px' }}>OUT OF STOCK</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              <div className="d-flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    style={{
                      width: '80px',
                      height: '80px',
                      flexShrink: 0,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: activeImageIdx === idx ? '2.5px solid var(--accent-red)' : '1.5px solid #E2E8F0',
                      cursor: 'pointer',
                      backgroundColor: '#fff',
                      transition: 'border-color 0.2s, transform 0.15s',
                      transform: activeImageIdx === idx ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: activeImageIdx === idx ? '0 4px 12px rgba(239,68,68,0.18)' : 'none'
                    }}
                  >
                    <Image src={getProductImageUrl(img)} alt="" className="w-100 h-100" width={160} height={160} sizes="80px" unoptimized style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>

            </div>
          </Col>

          {/* ── RIGHT: PRODUCT INFO ── */}
          <Col lg={6}>
            <div className="d-flex flex-column gap-3">

              {/* Title + Wishlist */}
              <div>
                <div className="product-title-row">
                  <h1 className="product-title-text fw-extrabold mb-0">
                    {product.name}
                  </h1>
                  <div className="product-title-actions">
                    <div
                      className="product-share-wrap"
                      ref={shareRef}
                      onMouseEnter={() => setShareOpen(true)}
                      onMouseLeave={() => setShareOpen(false)}
                    >
                      <button
                        type="button"
                        className={`product-share-btn${shareOpen ? ' active' : ''}`}
                        title="Share product"
                        aria-expanded={shareOpen}
                        onClick={() => setShareOpen((open) => !open)}
                      >
                        <IoShareSocialOutline size={18} color="#64748B" />
                      </button>
                      <div className={`product-share-menu${shareOpen ? ' show' : ''}`} role="menu">
                        {shareLinks.map((item) => (
                          item.href ? (
                            <a
                              key={item.key}
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className={`product-share-item ${item.className}`}
                              title={`Share on ${item.label}`}
                              role="menuitem"
                              onClick={() => setShareOpen(false)}
                            >
                              {item.icon}
                            </a>
                          ) : (
                            <button
                              key={item.key}
                              type="button"
                              className={`product-share-item ${item.className}`}
                              title={`Share on ${item.label}`}
                              role="menuitem"
                              onClick={item.onClick}
                            >
                              {item.icon}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      className={`product-wishlist-btn${isInWishlist() ? ' active' : ''}`}
                      title={isInWishlist() ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      {isInWishlist()
                        ? <IoHeart size={18} color="#EF4444" />
                        : <IoHeartOutline size={18} color="#64748B" />
                      }
                    </button>
                  </div>
                </div>

                {/* Ratings row */}
                <div className="d-flex align-items-center gap-3 flex-wrap mt-0" style={{ fontSize: '13.5px' }}>
                  <div className="d-flex align-items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <IoStarSharp key={s} size={14} color={s <= Math.round(product.ratings?.average || 0) ? '#F59E0B' : '#E2E8F0'} />
                    ))}
                    <span className="fw-bold ms-1" style={{ color: '#F59E0B' }}>{product.ratings?.average || 0}</span>
                  </div>
                  <span className="text-muted">({product.ratings?.count || 0} reviews)</span>
                </div>
              </div>

              {/* Pricing — flat, no box */}
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="fw-extrabold" style={{ fontSize: '34px', color: 'var(--primary-navy)', lineHeight: 1 }}>
                  ৳{displayPrice}
                </span>
                {product.discountPrice > 0 && (
                  <>
                    <span className="text-decoration-line-through text-muted" style={{ fontSize: '18px' }}>৳{product.price}</span>
                    <span className="product-save-badge">
                      Save ৳{product.price - product.discountPrice}
                    </span>
                  </>
                )}
              </div>

              {/* Variants */}
              <div className="d-flex flex-column gap-3">

                {/* Color Selector */}
                {product.variants?.colors?.length > 0 && (
                  <div>
                    <div className="mb-2">
                      <span className="fw-bold" style={{ fontSize: '13.5px', color: 'var(--primary-navy)' }}>Color</span>
                    </div>
                    <div className="product-color-swatches">
                      {product.variants.colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          title={color}
                          onClick={() => {
                            setSelectedColor(color);
                            const colorImgs = product.colorImages || {};
                            const mappedImg = colorImgs[color];
                            if (mappedImg) {
                              const imgIndex = product.images.indexOf(mappedImg);
                              setActiveImageIdx(imgIndex >= 0 ? imgIndex : 0);
                            }
                          }}
                          style={{
                            backgroundColor: color,
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            border: 'none',
                            outline: selectedColor === color ? '2px solid var(--accent-red)' : '1.5px solid #E2E8F0',
                            outlineOffset: '2px',
                            cursor: 'pointer',
                            transition: 'outline 0.15s, transform 0.15s',
                            transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.10)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {product.variants?.sizes?.length > 0 && (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold" style={{ fontSize: '13.5px', color: 'var(--primary-navy)' }}>Size</span>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      {product.variants.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          style={{
                            minWidth: '50px',
                            height: '42px',
                            padding: '0 16px',
                            borderRadius: '10px',
                            border: selectedSize === size ? '2px solid var(--accent-red)' : '1.5px solid #E2E8F0',
                            backgroundColor: selectedSize === size ? '#FEF2F2' : '#FFFFFF',
                            color: selectedSize === size ? 'var(--accent-red)' : 'var(--primary-navy)',
                            fontWeight: selectedSize === size ? 700 : 500,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: selectedSize === size ? '0 4px 12px rgba(239,68,68,0.15)' : 'none'
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="d-flex align-items-center gap-4">
                  <span className="fw-bold" style={{ fontSize: '13.5px', color: 'var(--primary-navy)' }}>Quantity</span>
                  <div
                    className="d-flex align-items-center bg-white"
                    style={{ border: '1.5px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}
                  >
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{
                        width: '42px', height: '42px', border: 'none',
                        backgroundColor: 'transparent', fontSize: '18px',
                        fontWeight: 700, color: '#64748B', cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      −
                    </button>
                    <span
                      style={{
                        minWidth: '44px', textAlign: 'center',
                        fontWeight: 700, fontSize: '16px',
                        color: 'var(--primary-navy)',
                        borderLeft: '1px solid #E2E8F0',
                        borderRight: '1px solid #E2E8F0',
                        padding: '0 8px',
                        lineHeight: '42px'
                      }}
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      style={{
                        width: '42px', height: '42px', border: 'none',
                        backgroundColor: 'transparent', fontSize: '18px',
                        fontWeight: 700, color: '#64748B', cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>

              {/* CTA Buttons */}
              <div className="product-cta-group">
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={product.stock === 0}
                  className="product-cta-btn product-cta-cart"
                >
                  <IoCart size={15} />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={handleTryOn}
                  disabled={product.stock === 0}
                  className="product-cta-btn product-cta-tryon"
                >
                  <IoScanOutline size={15} />
                  <span>Try On</span>
                </button>
              </div>

              {/* Custom Design Banner */}
              <div className="product-design-banner">
                <div className="product-design-banner-icon">
                  <IoColorPaletteOutline size={22} />
                </div>
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-1" style={{ color: 'var(--primary-navy)', fontSize: '14px' }}>Want a personalized print?</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '12.5px', lineHeight: '1.4' }}>Add custom text, logos or designs on this product.</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/design?productId=${product._id}`)}
                  className="product-design-banner-btn"
                >
                  Design Now →
                </button>
              </div>

              {/* Product Info Accordion */}
              {(product.description || product.specifications) && (
                <Accordion className="product-info-accordion">
                  {product.description && (
                    <Accordion.Item eventKey="description">
                      <Accordion.Header>Description</Accordion.Header>
                      <Accordion.Body>
                        <div
                          className="product-description-wysiwyg"
                          dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                      </Accordion.Body>
                    </Accordion.Item>
                  )}
                  {product.specifications && (
                    <Accordion.Item eventKey="specifications">
                      <Accordion.Header>Specifications &amp; Details</Accordion.Header>
                      <Accordion.Body>
                        <div
                          className="product-description-wysiwyg"
                          dangerouslySetInnerHTML={{ __html: product.specifications }}
                        />
                      </Accordion.Body>
                    </Accordion.Item>
                  )}
                </Accordion>
              )}

              {/* Trust Signal Grid */}
              <div
                className="p-3"
                style={{
                  borderRadius: '14px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E8EDF2'
                }}
              >
                <div className="row g-0">
                  {[
                    { icon: <IoCarOutline size={20} color="#3B82F6" />, bg: '#EFF6FF', title: 'Fast Delivery', sub: 'Dhaka 24h · Outside 3-4 days' },
                    { icon: <IoShieldCheckmarkOutline size={20} color="#10B981" />, bg: '#F0FDF4', title: 'Secure Payment', sub: 'bKash / Nagad / COD' },
                    { icon: <IoReturnDownBack size={20} color="#F59E0B" />, bg: '#FFFBEB', title: '7-Day Returns', sub: 'Hassle-free exchange' },
                    { icon: <IoCheckmarkCircle size={20} color="#8B5CF6" />, bg: '#F5F3FF', title: 'Verified Quality', sub: 'Premium print fabric' },
                  ].map((t, i) => (
                    <div key={i} className="col-6">
                      <div className="d-flex align-items-center gap-2 p-2">
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {t.icon}
                        </div>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '12px', color: 'var(--primary-navy)' }}>{t.title}</div>
                          <div className="text-muted" style={{ fontSize: '10.5px', lineHeight: '1.3' }}>{t.sub}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Col>

        </Row>

        {/* ── TABS SECTION ── */}
        <div className="mt-5 pt-4">

          {/* Custom Tab Bar */}
          <div className="d-flex gap-1 mb-0" style={{ borderBottom: '2px solid #E2E8F0', overflowX: 'auto', paddingBottom: '0' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="border-0 fw-semibold bg-transparent"
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  color: activeTab === tab.key ? 'var(--accent-red)' : '#64748B',
                  borderBottom: activeTab === tab.key ? '3px solid var(--accent-red)' : '3px solid transparent',
                  marginBottom: '-2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.2px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white p-4 p-md-5" style={{ borderRadius: '0 0 20px 20px', border: '1px solid #E2E8F0', borderTop: 'none', boxShadow: '0 4px 24px rgba(15,23,42,0.04)' }}>

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <Row className="gy-5">

                {/* Left: Rating Overview + Write Review */}
                <Col md={5}>
                  <h5 className="fw-bold mb-4" style={{ color: 'var(--primary-navy)', fontSize: '16px' }}>Rating Overview</h5>

                  <div className="d-flex align-items-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="fw-extrabold" style={{ fontSize: '52px', lineHeight: 1, color: 'var(--primary-navy)' }}>
                        {product.ratings?.average || 0}
                      </div>
                      <div className="d-flex gap-0 justify-content-center mt-1">
                        {[1,2,3,4,5].map(s => (
                          <IoStarSharp key={s} size={16} color={s <= Math.round(product.ratings?.average || 0) ? '#F59E0B' : '#E2E8F0'} />
                        ))}
                      </div>
                      <div className="text-muted mt-1" style={{ fontSize: '12px' }}>{product.ratings?.count || 0} reviews</div>
                    </div>
                    <div className="flex-grow-1 d-flex flex-column gap-1">
                      {[5,4,3,2,1].map((stars) => {
                        const count = (product.reviews || []).filter(r => r.rating === stars).length;
                        const pct = product.reviews?.length > 0 ? (count / product.reviews.length) * 100 : 0;
                        return (
                          <div key={stars} className="d-flex align-items-center gap-2" style={{ fontSize: '12px' }}>
                            <span style={{ minWidth: '32px', color: '#64748B' }}>{stars}★</span>
                            <div style={{ flexGrow: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: '3px', transition: 'width 0.6s' }} />
                            </div>
                            <span style={{ minWidth: '28px', textAlign: 'right', color: '#64748B' }}>{Math.round(pct)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Write Review Form */}
                  <div className="p-4" style={{ borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <h6 className="fw-bold mb-1" style={{ color: 'var(--primary-navy)', fontSize: '15px' }}>Write a Review</h6>
                    <p className="text-muted mb-3" style={{ fontSize: '12.5px' }}>Share your experience to help others.</p>

                    <form onSubmit={handleReviewSubmit}>
                      <div className="mb-3">
                        <label className="small fw-bold d-block mb-1" style={{ color: '#374151' }}>Your Rating *</label>
                        <div className="d-flex gap-1">
                          {[1,2,3,4,5].map((star) => (
                            <IoStarSharp
                              key={star}
                              size={28}
                              color={star <= (hoverRating || newReviewRating) ? '#F59E0B' : '#E2E8F0'}
                              style={{ cursor: 'pointer', transition: 'color 0.1s, transform 0.1s', transform: star <= (hoverRating || newReviewRating) ? 'scale(1.1)' : 'scale(1)' }}
                              onClick={() => setNewReviewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="small fw-bold d-block mb-1" style={{ color: '#374151' }}>Your Name *</label>
                        <input
                          type="text" required
                          placeholder="e.g. Tanvir Rahman"
                          value={newReviewName}
                          onChange={e => setNewReviewName(e.target.value)}
                          className="form-control-premium w-100"
                          style={{ borderRadius: '10px', padding: '10px 14px', fontSize: '14px' }}
                        />
                      </div>

                      <div className="mb-4">
                        <label className="small fw-bold d-block mb-1" style={{ color: '#374151' }}>Review Comment *</label>
                        <textarea
                          rows={3} required
                          placeholder="What did you like or dislike about this product?"
                          value={newReviewComment}
                          onChange={e => setNewReviewComment(e.target.value)}
                          className="form-control-premium w-100"
                          style={{ borderRadius: '10px', padding: '10px 14px', fontSize: '14px', resize: 'vertical' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="w-100 border-0 fw-bold text-white d-flex align-items-center justify-content-center gap-2"
                        style={{
                          height: '46px', borderRadius: '12px',
                          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                          fontSize: '14px', cursor: submittingReview ? 'not-allowed' : 'pointer',
                          opacity: submittingReview ? 0.7 : 1
                        }}
                      >
                        {submittingReview ? 'Submitting...' : '✓ Submit Review'}
                      </button>
                    </form>
                  </div>
                </Col>

                {/* Right: Reviews List */}
                <Col md={7}>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h5 className="fw-bold mb-0" style={{ color: 'var(--primary-navy)', fontSize: '16px' }}>Customer Reviews</h5>
                    <select
                      value={reviewSort}
                      onChange={e => setReviewSort(e.target.value)}
                      className="form-select-premium"
                      style={{ width: '150px', fontSize: '12.5px', padding: '6px 10px', borderRadius: '8px' }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="highest">Highest Rating</option>
                      <option value="lowest">Lowest Rating</option>
                    </select>
                  </div>

                  {(!product.reviews || product.reviews.length === 0) ? (
                    <div
                      className="text-center py-5"
                      style={{ borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div style={{ fontSize: '40px' }}>✍️</div>
                      <h6 className="fw-bold mt-3 mb-1" style={{ color: 'var(--primary-navy)' }}>No Reviews Yet</h6>
                      <p className="text-muted small mb-0">Be the first to share your experience!</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3" style={{ maxHeight: '620px', overflowY: 'auto', paddingRight: '4px' }}>
                      {sortedReviews.map((rev) => (
                        <div
                          key={rev._id}
                          className="p-4"
                          style={{
                            borderRadius: '14px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E8EDF2',
                            boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                            transition: 'box-shadow 0.2s'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="fw-extrabold text-white d-flex align-items-center justify-content-center"
                                style={{
                                  width: '36px', height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--primary-navy)',
                                  fontSize: '14px', flexShrink: 0
                                }}
                              >
                                {rev.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="fw-bold d-block" style={{ fontSize: '14px', color: 'var(--primary-navy)' }}>{rev.name}</span>
                                <span className="text-muted" style={{ fontSize: '11px' }}>
                                  {new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                            <div className="d-flex gap-0">
                              {[1,2,3,4,5].map(s => (
                                <IoStarSharp key={s} size={13} color={s <= rev.rating ? '#F59E0B' : '#E2E8F0'} />
                              ))}
                            </div>
                          </div>
                          <p className="mb-0" style={{ fontSize: '13.5px', lineHeight: '1.6', color: '#4B5563' }}>
                            "{rev.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Col>

              </Row>
            )}

            {/* Shipping Tab */}
            {activeTab === 'shipping' && (
              <div className="product-description-wysiwyg" style={{ fontSize: '14.5px', lineHeight: '1.8' }}>
                {product.shippingReturns ? (
                  <div dangerouslySetInnerHTML={{ __html: product.shippingReturns }} />
                ) : (
                  <div>
                    <div className="d-flex flex-column gap-3">
                      {[
                        { icon: '🚀', title: 'Inside Dhaka', desc: 'Flat ৳80 delivery charge. Dispatched via Paperfly / Pathao. Estimated arrival: 1-2 working days.' },
                        { icon: '🚛', title: 'Outside Dhaka', desc: 'Flat ৳150 delivery charge. Dispatched via Steadfast / SA Paribahan. Estimated arrival: 3-4 working days.' },
                        { icon: '🔄', title: '7-Day Replacement Policy', desc: 'We support full size-exchanges or print-error replacements within 7 days of delivery. Keep tags attached and clothes unwashed.' },
                      ].map((s, i) => (
                        <div key={i} className="d-flex gap-3 p-4" style={{ borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                          <span style={{ fontSize: '28px', flexShrink: 0 }}>{s.icon}</span>
                          <div>
                            <h6 className="fw-bold mb-1" style={{ color: 'var(--primary-navy)' }}>{s.title}</h6>
                            <p className="text-muted mb-0" style={{ fontSize: '13.5px' }}>{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Size Guide Tab */}
            {activeTab === 'size-guide' && (
              <div className="product-description-wysiwyg">
                {product.sizeGuide ? (
                  <div dangerouslySetInnerHTML={{ __html: product.sizeGuide }} />
                ) : (
                  <div>
                    <h6 className="fw-bold mb-4" style={{ color: 'var(--primary-navy)', fontSize: '16px' }}>Standard T-Shirt Size Guide (inches)</h6>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table table-bordered text-center" style={{ fontSize: '14px', borderRadius: '12px', overflow: 'hidden' }}>
                        <thead style={{ backgroundColor: 'var(--primary-navy)', color: '#fff' }}>
                          <tr>
                            <th className="py-3" style={{ backgroundColor: 'var(--primary-navy)', color: '#fff', border: 'none' }}>Size</th>
                            <th className="py-3" style={{ backgroundColor: 'var(--primary-navy)', color: '#fff', border: 'none' }}>Chest (in)</th>
                            <th className="py-3" style={{ backgroundColor: 'var(--primary-navy)', color: '#fff', border: 'none' }}>Length (in)</th>
                            <th className="py-3" style={{ backgroundColor: 'var(--primary-navy)', color: '#fff', border: 'none' }}>Sleeve</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[['S','36–38','26.5','7.5'],['M','38–40','27.5','8.0'],['L','40–42','28.5','8.5'],['XL','42–44','29.5','9.0'],['XXL','44–46','30.5','9.5']].map(([sz, ch, ln, sl], i) => (
                            <tr key={sz} style={{ backgroundColor: i % 2 === 0 ? '#FAFBFC' : '#FFFFFF' }}>
                              <td className="fw-bold py-3" style={{ color: 'var(--primary-navy)' }}>{sz}</td>
                              <td className="py-3">{ch}</td>
                              <td className="py-3">{ln}</td>
                              <td className="py-3">{sl}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-muted mt-3" style={{ fontSize: '12.5px' }}>
                      💡 Tip: When in doubt, size up for a relaxed fit or size down for a fitted look. All measurements are approximate.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </Container>
    </div>
  );
}
