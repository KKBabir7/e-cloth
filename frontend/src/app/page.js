'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Badge, Modal } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { IoShirtOutline, IoCartOutline, IoHeartOutline, IoHeart, IoCheckmarkCircle, IoArrowForward, IoImageOutline, IoLayersOutline, IoFlashOutline, IoLockClosedOutline, IoRefreshOutline, IoStar, IoShieldCheckmarkOutline } from 'react-icons/io5';
import { FiChevronLeft, FiChevronRight, FiZoomIn } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../store/wishlistSlice';
import { addToCart, updateCartQty } from '../store/cartSlice';
import { useUI } from '../context/UIContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getBackendUrl, getProductImageUrl } from '@/utils/api';
import { getCategoryAccentFallback } from '@/utils/imageColor';
import CategoryShowcaseIcon from '../components/CategoryShowcaseIcon';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast, openOptionsModal } = useUI();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);

  const [zoomImage, setZoomImage] = useState(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/products?limit=8&sort=popular`);
      if (res.data.success) {
        return res.data.products;
      }
      // Throw so a failed/empty fetch is NOT cached & persisted as a successful empty result
      throw new Error('Failed to load trending products');
    }
  });

  const products = productsData || [];

  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useQuery({
    queryKey: ['products', 'newArrivals'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/products?limit=8&sort=newest`);
      if (res.data.success) {
        return res.data.products;
      }
      // Throw so a failed/empty fetch is NOT cached & persisted as a successful empty result
      throw new Error('Failed to load new arrivals');
    }
  });

  const newArrivals = newArrivalsData || [];


  const { data: slidesData, isLoading: slidesLoading } = useQuery({
    queryKey: ['heroSlides'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/hero-slides`);
      if (res.data.success) return res.data.slides;
      return [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24h — SSE handles all live invalidation, no need to refetch
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/categories`);
        if (res.data.success) return res.data.categories;
        return [];
      } catch (err) {
        return [];
      }
    }
  });

  const categories = categoriesData || [];

  // ── Real-time updates are handled globally by Providers.js (GlobalRealtimeSync) ──
  // When admin changes anything, backend broadcasts via /api/events → Providers
  // invalidates the correct queryKey → this component auto-refetches. No SSE needed here.

  const slides = slidesData || [];

  const handleToggleWishlist = (product) => {
    dispatch(toggleWishlist({
      id: product._id,
      name: product.name,
      price: product.discountPrice > 0 ? product.discountPrice : product.price,
      image: product.images[0]
    }));
    showToast('Wishlist updated!', 'info');
  };

  const handleQuickAdd = (product) => {
    openOptionsModal(product, (selections) => {
      const existingItem = cartItems?.find(
        (item) =>
          item.productId.toString() === product._id.toString() &&
          item.size === selections.size &&
          item.color === selections.color
      );

      if (existingItem) {
        dispatch(updateCartQty({
          productId: product._id,
          size: selections.size,
          color: selections.color,
          quantity: selections.quantity
        }));
      } else {
        dispatch(addToCart({
          productId: product._id,
          name: product.name,
          price: product.discountPrice > 0 ? product.discountPrice : product.price,
          image: product.images[0],
          size: selections.size,
          color: selections.color,
          quantity: selections.quantity,
          isCustom: false
        }));
      }
      showToast(`${product.name} added to cart!`, 'success');
    });
  };

  const isInWishlist = (id) => wishlistItems.some((item) => item.id === id);
  const isInCart = (id) => cartItems?.some((item) => item.productId === id);

  const renderProductCard = (product) => {
    const isDiscounted = product.discountPrice > 0;
    const discountPercent = isDiscounted ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

    return (
      <div className="custom-card d-flex flex-column h-100">
        {/* Image wrapper */}
        <div className="product-image-container position-relative overflow-hidden">
          <Link href={`/product/${product.slug || product._id}`}>
            <Image
              src={getProductImageUrl(product.images[0])}
              alt={product.name}
              className="primary-img"
              width={520}
              height={520}
              sizes="(max-width: 576px) 45vw, (max-width: 992px) 30vw, 20vw"
              unoptimized
            />
            {product.images && product.images.length > 1 && (
              <Image
                src={getProductImageUrl(product.images[1])}
                alt={product.name}
                className="secondary-img"
                width={520}
                height={520}
                sizes="(max-width: 576px) 45vw, (max-width: 992px) 30vw, 20vw"
                unoptimized
              />
            )}
          </Link>

          {/* Wishlist Floating Button */}
          <button
            onClick={() => handleToggleWishlist(product)}
            className="position-absolute border-0 rounded-circle d-flex align-items-center justify-content-center wishlist-float-btn"
            title={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            {isInWishlist(product._id) ? (
              <IoHeart size={16} color="var(--accent-red)" />
            ) : (
              <IoHeartOutline size={16} color="#475569" />
            )}
          </button>

          {/* Zoom Floating Button */}
          <button
            onClick={() => setZoomImage(getProductImageUrl(product.images[0]))}
            className="position-absolute border-0 rounded-circle d-flex align-items-center justify-content-center zoom-float-btn"
            title="Zoom Image"
          >
            <FiZoomIn size={16} color="#475569" />
          </button>
        </div>
        
        {/* Details */}
        <div className="product-details d-flex flex-column flex-grow-1">
          <Link href={`/product/${product.slug || product._id}`} className="text-decoration-none">
            <h4 className="product-card-title text-truncate">
              {product.name}
            </h4>
          </Link>
          
          {/* Price and Actions Section */}
          <div className="d-flex align-items-center justify-content-between mt-auto pt-1">
            {/* Price */}
            <div className="d-flex align-items-baseline gap-1">
              {isDiscounted ? (
                <>
                  <span className="product-card-price discounted">৳{product.discountPrice}</span>
                  <span className="product-card-price-original">৳{product.price}</span>
                </>
              ) : (
                <span className="product-card-price">৳{product.price}</span>
              )}
            </div>

            {/* Actions */}
            <div className="d-flex align-items-center gap-2">
              {isDiscounted && (
                <span className="discount-badge-inline">
                  Save {discountPercent}%
                </span>
              )}
              <button
                onClick={() => handleQuickAdd(product)}
                disabled={product.stock === 0}
                className={`card-action-btn ${isInCart(product._id) ? 'active' : ''}`}
                title="Add to Cart"
              >
                <IoCartOutline size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 1. HERO SLIDER — Swiper.js: touch/drag/swipe + autoplay */}
      {!slidesLoading && slides.length > 0 && (
        <section className="hero-swiper-section mb-0">
          <Swiper
            modules={[Navigation, Pagination, Autoplay, A11y]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
            loop={slides.length > 1}
            grabCursor={true}
            speed={650}
            a11y={{ prevSlideMessage: 'Previous banner', nextSlideMessage: 'Next banner' }}
            preventClicks={true}
            preventClicksPropagation={true}
            threshold={8}
            className="hero-swiper"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide._id}>
                <Link href={slide.link || '/shop'} className="d-block">
                  <Image
                    src={slide.image && (slide.image.startsWith('http') ? slide.image : `${getBackendUrl()}${slide.image}`)}
                    alt={slide.title || 'Promotional Banner'}
                    className="hero-swiper-img"
                    width={1920}
                    height={700}
                    sizes="100vw"
                    priority
                    unoptimized
                    draggable={false}
                  />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* 2. CATEGORY SHOWCASE CARDS */}
      {!categoriesLoading && categories.length > 0 && (
        <section className="category-showcase-section">
          <Container>
            <div className="category-showcase-track">
              <Link href="/shop" className="category-showcase-card-wrap text-decoration-none">
                <div className="category-showcase-card">
                  <div
                    className="category-showcase-icon-wrap category-showcase-icon-wrap--icon"
                    style={{ '--cat-accent': '#1e293b' }}
                  >
                    <IoLayersOutline size={22} color="#1e293b" />
                  </div>
                  <div className="category-showcase-text">
                    <span className="category-showcase-title">Shop</span>
                    <span className="category-showcase-tagline">View All Products</span>
                  </div>
                </div>
              </Link>

              {categories.map((cat, idx) => {
                const accent = getCategoryAccentFallback(cat, idx);
                return (
                  <Link
                    key={cat._id || cat.slug}
                    href={`/shop?category=${cat.slug}`}
                    className="category-showcase-card-wrap text-decoration-none"
                  >
                    <div className="category-showcase-card">
                      <CategoryShowcaseIcon
                        src={getProductImageUrl(cat.image)}
                        alt={cat.name}
                        fallbackAccent={accent}
                      />
                      <div className="category-showcase-text">
                        <span className="category-showcase-title">{cat.name}</span>
                        <span className="category-showcase-tagline">
                          {cat.tagline || 'Explore Collection'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* 3. featured / TRENDING PRODUCTS */}
      <section className="pt-3 pb-4 pt-md-5 pb-md-5 bg-white">
        <Container>
          <div className="responsive-section-header mb-4 mb-md-5">
            <div>
              <h2 className="fw-bold" style={{ color: 'var(--primary-navy)' }}>Trending Collection</h2>
              <p className="text-muted mb-0">Hot apparel selling right now in Bangladesh</p>
            </div>
            <Link href="/shop" className="btn-view-all btn-view-all-desktop">
              View All Products &rarr;
            </Link>
          </div>

          {isLoading ? (
            <Row className="g-2 g-md-3">
              {[1, 2, 3, 4].map((i) => (
                <Col key={i} lg={3} md={6} xs={6}>
                  <Card className="border-0 shadow-sm rounded-4 p-3" style={{ height: '380px' }}>
                    <div className="skeleton rounded-4 mb-3" style={{ height: '220px' }}></div>
                    <div className="skeleton mb-2" style={{ height: '20px', width: '80%' }}></div>
                    <div className="skeleton mb-3" style={{ height: '15px', width: '50%' }}></div>
                    <div className="skeleton" style={{ height: '35px' }}></div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Row className="g-2 g-md-3">
              {products.map((product) => (
                <Col key={product._id} lg={3} md={6} xs={6}>
                  {renderProductCard(product)}
                </Col>
              ))}
            </Row>
          )}

          <div className="btn-view-all-mobile-wrap">
            <Link href="/shop" className="btn-view-all">
              View All Products &rarr;
            </Link>
          </div>
        </Container>
      </section>

      {/* New Arrivals Section */}
      <section className="py-4 py-md-5 bg-white">
        <Container>
          <div className="responsive-section-header mb-4 mb-md-5">
            <div>
              <h2 className="fw-bold" style={{ color: 'var(--primary-navy)' }}>New Arrivals</h2>
              <p className="text-muted mb-0">Discover the latest additions to our collection</p>
            </div>
            <Link href="/shop?sort=newest" className="btn-view-all btn-view-all-desktop">
              View All New &rarr;
            </Link>
          </div>

          {newArrivalsLoading ? (
            <Row className="g-2 g-md-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <Col key={i} lg={3} md={6} xs={6}>
                  <Card className="border-0 shadow-sm rounded-4 p-3" style={{ height: '380px' }}>
                    <div className="skeleton rounded-4 mb-3" style={{ height: '220px' }}></div>
                    <div className="skeleton mb-2" style={{ height: '20px', width: '80%' }}></div>
                    <div className="skeleton mb-3" style={{ height: '15px', width: '50%' }}></div>
                    <div className="skeleton" style={{ height: '35px' }}></div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Row className="g-2 g-md-3">
              {newArrivals.map((product) => (
                <Col key={product._id} lg={3} md={6} xs={6}>
                  {renderProductCard(product)}
                </Col>
              ))}
            </Row>
          )}

          <div className="btn-view-all-mobile-wrap">
            <Link href="/shop?sort=newest" className="btn-view-all">
              View All New &rarr;
            </Link>
          </div>
        </Container>
      </section>

      {/* 4. DESIGN STUDIO CTA — 3 column layout */}
      <section className="design-cta-section">
        <Container>
          <div className="design-studio-cta-card">
            <Row className="g-4 g-lg-3 align-items-center">
              <Col lg={4} md={12}>
                <div className="design-studio-cta-copy">
                  <span className="design-studio-cta-eyebrow">Unleash Your Creativity</span>
                  <h2 className="design-studio-cta-title">Custom T-Shirt Printing Studio</h2>
                  <p className="design-studio-cta-desc">
                    Upload your design, add text, choose colors and see live preview in our advanced design studio.
                  </p>
                  <Link href="/design" className="btn-launch-canvas design-studio-cta-btn">
                    Start Designing Now
                    <IoArrowForward size={16} className="btn-launch-canvas-icon" />
                  </Link>
                </div>
              </Col>

              <Col lg={4} md={12}>
                <div className="design-studio-cover-wrap">
                  <Image
                    src="/custom-design/design-cover.webp"
                    alt="Custom T-Shirt design studio preview"
                    width={560}
                    height={400}
                    className="design-studio-cover-img"
                    unoptimized
                  />
                </div>
              </Col>

              <Col lg={4} md={12}>
                <div className="design-studio-feature-list">
                  {[
                    { icon: <IoImageOutline size={20} />, title: 'HD Quality', desc: 'High resolution prints' },
                    { icon: <IoShirtOutline size={20} />, title: '180+ GSM Cotton', desc: 'Premium fabric' },
                    { icon: <IoFlashOutline size={20} />, title: 'Fast Production', desc: 'Quick turnaround' },
                  ].map((item) => (
                    <div key={item.title} className="design-studio-feature-card">
                      <span className="design-studio-feature-icon">{item.icon}</span>
                      <div>
                        <span className="design-studio-feature-title">{item.title}</span>
                        <span className="design-studio-feature-desc">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* 5. TRUST BAR */}
      <section className="home-trust-bar-section">
        <Container>
          <div className="home-trust-bar">
            {[
              { icon: <IoLockClosedOutline size={22} />, title: '100% Secure Payment', desc: 'Your payment info is safe with us' },
              { icon: <IoRefreshOutline size={22} />, title: '7-Day Easy Return', desc: 'Hassle-free return policy' },
              { icon: <IoStar size={22} />, title: 'Premium Quality', desc: 'Top grade fabrics only' },
              { icon: <IoShieldCheckmarkOutline size={22} />, title: 'Customer Satisfaction', desc: 'We care about you' },
            ].map((item) => (
              <div key={item.title} className="home-trust-item">
                <span className="home-trust-icon">{item.icon}</span>
                <div className="home-trust-text">
                  <span className="home-trust-title">{item.title}</span>
                  <span className="home-trust-desc">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Premium Image Lightbox Modal */}
      <Modal 
        show={!!zoomImage} 
        onHide={() => setZoomImage(null)} 
        centered 
        size="lg"
        dialogClassName="modal-dialog-centered"
        contentClassName="bg-transparent border-0 shadow-none"
      >
        <Modal.Body className="p-0 position-relative d-flex justify-content-center align-items-center">
          <button 
            onClick={() => setZoomImage(null)}
            className="position-absolute btn-close btn-close-white" 
            style={{ 
              top: '-40px', 
              right: '0', 
              zIndex: 1050,
              backgroundSize: '1.2em',
              padding: '0.8rem',
              opacity: 0.8,
              cursor: 'pointer'
            }} 
            aria-label="Close"
          ></button>
          <img 
            src={zoomImage} 
            alt="Product preview" 
            className="img-fluid"
            style={{ 
              maxHeight: '80vh', 
              objectFit: 'contain',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              backgroundColor: '#FFFFFF',
              borderRadius: '0px'
            }} 
          />
        </Modal.Body>
      </Modal>

      <style>{`
        .hero-slider-wrap,
        .hero-slider-wrap .carousel-inner,
        .hero-slider-wrap .carousel-item {
          border-radius: 0 !important;
        }
        .hero-banner-img {
          height: 480px;
          object-fit: cover;
        }
        @media (max-width: 768px) {
          .hero-banner-img {
            height: 250px;
          }
        }
        .scale-hover-img {
          transition: transform 0.5s ease;
        }
      
        .float-bounce {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
