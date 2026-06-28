'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Container, Row, Col, Button, Badge, Form, Accordion } from 'react-bootstrap';
import {
  IoCart, IoHeartOutline, IoHeart, IoCarOutline,
  IoShieldCheckmarkOutline, IoLogoFacebook, IoLogoInstagram,
  IoChevronForward, IoStarSharp, IoShareSocialOutline,
  IoCheckmarkCircle, IoReturnDownBack, IoTimeOutline,
  IoScanOutline, IoColorPaletteOutline, IoLockClosedOutline
} from 'react-icons/io5';
import { FaXTwitter, FaPinterest } from 'react-icons/fa6';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../../../store/wishlistSlice';
import { addToCart } from '../../../store/cartSlice';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getBackendUrl, getProductImageUrl } from '@/utils/api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { showToast } = useUI();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

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
  const [thumbSwiper, setThumbSwiper] = useState(null);
  const [thumbsOverflow, setThumbsOverflow] = useState(false);
  const thumbsWrapRef = useRef(null);
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
    if (!thumbSwiper || thumbSwiper.destroyed) return;
    thumbSwiper.slideTo(activeImageIdx);
  }, [activeImageIdx, thumbSwiper]);

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

  useEffect(() => {
    if (isAuthenticated && user?.name) {
      setNewReviewName(user.name);
    }
  }, [isAuthenticated, user?.name]);

  const loginRedirect = `/login?redirect=${encodeURIComponent(pathname || '/')}`;

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
    const reviewerName = (isAuthenticated && user?.name) ? user.name : newReviewName.trim();
    if (!reviewerName || !newReviewComment.trim()) {
      showToast('Please fill out your name and review comment!', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/products/${product._id}/reviews`, {
        name: reviewerName,
        rating: newReviewRating,
        comment: newReviewComment.trim()
      });
      if (res.data.success) {
        showToast('Thank you! Your review has been published.', 'success');
        if (!isAuthenticated) setNewReviewName('');
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
            <div className="skeleton product-detail-main-image rounded-4 mb-3" />
            <div className="product-detail-thumbs d-flex">
              {[1,2,3,4].map(i => <div key={i} className="skeleton product-detail-thumb rounded-3" />)}
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

  const productReviews = product.reviews || [];
  const reviewCount = productReviews.length;
  const reviewAverage = reviewCount > 0
    ? Number((productReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewCount).toFixed(1))
    : Number(product.ratings?.average || 0);

  const sortedReviews = [...productReviews].sort((a, b) => {
    if (reviewSort === 'highest') return Number(b.rating) - Number(a.rating);
    if (reviewSort === 'lowest') return Number(a.rating) - Number(b.rating);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const TABS = [
    { key: 'reviews', label: `Reviews (${reviewCount})` },
    { key: 'shipping', label: 'Shipping & Returns' },
    { key: 'size-guide', label: 'Size Guide' },
  ];

  const imageCount = product.images?.length || 0;

  const renderThumbButton = (img, idx) => (
    <button
      type="button"
      onClick={() => setActiveImageIdx(idx)}
      className={`product-detail-thumb${activeImageIdx === idx ? ' active' : ''}`}
      aria-label={`View product image ${idx + 1}`}
      aria-pressed={activeImageIdx === idx}
    >
      <Image
        src={getProductImageUrl(img)}
        alt=""
        className="w-100 h-100"
        width={160}
        height={160}
        sizes="80px"
        unoptimized
        style={{ objectFit: 'cover' }}
      />
    </button>
  );

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
            <div className="product-detail-gallery d-flex flex-column gap-3">

              {/* Main Image + Zoom */}
              <div
                className="product-detail-main-image position-relative overflow-hidden bg-white"
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
              {imageCount > 1 && (
                <div
                  ref={thumbsWrapRef}
                  className={`product-detail-thumbs-wrap${thumbsOverflow ? ' is-overflow' : ''}`}
                >
                  <Swiper
                    modules={[FreeMode, Navigation, A11y]}
                    onSwiper={(s) => {
                      setThumbSwiper(s);
                      setThumbsOverflow(!s.isLocked);
                    }}
                    onLock={() => setThumbsOverflow(false)}
                    onUnlock={() => setThumbsOverflow(true)}
                    slidesPerView="auto"
                    spaceBetween={8}
                    freeMode={{ enabled: true }}
                    navigation
                    watchOverflow
                    observer
                    observeParents
                    className="product-detail-thumbs-swiper"
                    breakpoints={{
                      0: { spaceBetween: 6 },
                      572: { spaceBetween: 8 },
                    }}
                  >
                    {product.images.map((img, idx) => (
                      <SwiperSlide key={idx} className="product-detail-thumb-slide">
                        {renderThumbButton(img, idx)}
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}

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
                      <IoStarSharp key={s} size={14} color={s <= Math.round(reviewAverage) ? '#F59E0B' : '#E2E8F0'} />
                    ))}
                    <span className="fw-bold ms-1" style={{ color: '#F59E0B' }}>{reviewAverage}</span>
                  </div>
                  <span className="text-muted">({reviewCount} reviews)</span>
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
        <div className="product-tabs-section mt-1 mt-sm-5 pt-4">

          <div className="product-tabs-bar">
            {TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`product-tab-btn${activeTab === tab.key ? ' active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="product-tabs-panel">

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <Row className="gy-4 gy-lg-5">

                <Col lg={5}>
                  <div className="product-rating-overview">
                    <h5 className="product-reviews-heading">Rating Overview</h5>

                    <div className="product-rating-summary">
                      <div className="product-rating-score-block">
                        <div className="product-rating-score">{reviewAverage}</div>
                        <div className="product-rating-stars">
                          {[1, 2, 3, 4, 5].map(s => (
                            <IoStarSharp
                              key={s}
                              size={15}
                              color={s <= Math.round(reviewAverage) ? '#F59E0B' : '#E2E8F0'}
                            />
                          ))}
                        </div>
                        <div className="product-rating-count">
                          {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                        </div>
                      </div>

                      <div className="product-rating-bars">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = productReviews.filter(r => Math.round(Number(r.rating)) === stars).length;
                          const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                          return (
                            <div key={stars} className="product-rating-bar-row">
                              <span className="product-rating-bar-label">{stars}</span>
                              <IoStarSharp size={11} color="#F59E0B" className="product-rating-bar-star" />
                              <div className="product-rating-bar-track">
                                <div className="product-rating-bar-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="product-rating-bar-pct">{Math.round(pct)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="product-review-form">
                    <div className="product-review-form-header">
                      <h6 className="product-review-form-title">Write a Review</h6>
                    </div>

                    {isAuthenticated ? (
                      <form onSubmit={handleReviewSubmit}>
                        <p className="product-review-form-sub mb-3" style={{ fontSize: '13px' }}>
                          Sharing as <strong>{user?.name || 'Customer'}</strong>
                        </p>

                        <div className="mb-3">
                          <label className="product-review-label">Your Rating *</label>
                          <div className="product-review-star-input">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className={`product-review-star-btn${star <= (hoverRating || newReviewRating) ? ' active' : ''}`}
                                onClick={() => setNewReviewRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                aria-label={`Rate ${star} stars`}
                              >
                                <IoStarSharp size={26} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="product-review-label">Review Comment *</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="What did you like or dislike about this product?"
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            className="form-control-premium product-review-input product-review-textarea"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="product-review-submit w-100"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-4 px-3 bg-light rounded-4 border border-dashed d-flex flex-column align-items-center justify-content-center gap-3">
                        <div className="rounded-circle bg-danger bg-opacity-10 p-3 text-danger">
                          <IoLockClosedOutline size={26} />
                        </div>
                        <p className="text-muted small mb-0 fw-semibold text-center" style={{ maxWidth: '240px' }}>
                          You must be logged in to share your premium review and experience.
                        </p>
                        <Link href={loginRedirect} passHref legacyBehavior>
                          <a className="btn btn-danger btn-premium-accent bg-red-gradient text-white border-0 px-4 py-2 fw-bold rounded-3 text-decoration-none shadow-sm" style={{ fontSize: '13px' }}>
                            Login to Account
                          </a>
                        </Link>
                      </div>
                    )}
                  </div>
                </Col>

                <Col lg={7}>
                  <div className="product-reviews-list-header">
                    <h5 className="product-reviews-heading mb-0">Customer Reviews</h5>
                    {reviewCount > 0 && (
                      <select
                        value={reviewSort}
                        onChange={e => setReviewSort(e.target.value)}
                        className="form-select-premium product-review-sort"
                      >
                        <option value="newest">Newest First</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                      </select>
                    )}
                  </div>

                  {reviewCount === 0 ? (
                    <div className="product-review-empty">
                      <div className="product-review-empty-icon">
                        <IoStarSharp size={28} color="#F59E0B" />
                      </div>
                      <h6 className="product-review-empty-title">No Reviews Yet</h6>
                      <p className="product-review-empty-text">Be the first to share your experience with this product.</p>
                    </div>
                  ) : (
                    <div className="product-reviews-list">
                      {sortedReviews.map((rev, idx) => (
                        <article
                          key={rev._id || `${rev.createdAt}-${idx}`}
                          className="product-review-card"
                        >
                          <div className="product-review-card-top">
                            <div className="product-review-author">
                              <div className="product-review-avatar" aria-hidden="true">
                                {(rev.name || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="product-review-author-name">{rev.name}</span>
                                <span className="product-review-date">
                                  {new Date(rev.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="product-review-card-stars">
                              {[1, 2, 3, 4, 5].map(s => (
                                <IoStarSharp
                                  key={s}
                                  size={13}
                                  color={s <= Number(rev.rating) ? '#F59E0B' : '#E2E8F0'}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="product-review-comment">{rev.comment}</p>
                        </article>
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
