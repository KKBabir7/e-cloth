'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Badge, Modal } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { IoShirtOutline, IoSparkles, IoCart, IoHeartOutline, IoHeart, IoCheckmarkCircle } from 'react-icons/io5';
import { FiChevronLeft, FiChevronRight, FiZoomIn } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../store/wishlistSlice';
import { addToCart } from '../store/cartSlice';
import { useUI } from '../context/UIContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getBackendUrl, getProductImageUrl } from '@/utils/api';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useUI();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);

  const [mounted, setMounted] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/products?limit=4&sort=popular`);
        if (res.data.success) {
          return res.data.products;
        }
        throw new Error('Not successful');
      } catch (err) {
        console.warn('Backend server unseeded or offline');
        return [];
      }
    }
  });

  const products = productsData || [];

  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useQuery({
    queryKey: ['products', 'newArrivals'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/products?limit=10&sort=newest`);
        if (res.data.success) {
          return res.data.products;
        }
        throw new Error('Not successful');
      } catch (err) {
        console.warn('Backend server offline');
        return [];
      }
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
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.discountPrice > 0 ? product.discountPrice : product.price,
      image: product.images[0],
      size: 'L', // default size selection
      color: '#000000', // default black variant
      quantity: 1,
      isCustom: false
    }));
    showToast(`${product.name} (Size: L) added to cart!`, 'success');
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
            <Card.Img
              variant="top"
              src={getProductImageUrl(product.images[0])}
              alt={product.name}
              className="primary-img"
            />
            {product.images && product.images.length > 1 && (
              <Card.Img
                variant="top"
                src={getProductImageUrl(product.images[1])}
                alt={product.name}
                className="secondary-img"
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
                <IoCart size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-3">Loading Home page...</p>
      </Container>
    );
  }

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
            className="hero-swiper"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide._id}>
                <Link href={slide.link || '/shop'} className="d-block">
                  <img
                    src={slide.image && (slide.image.startsWith('http') ? slide.image : `${getBackendUrl()}${slide.image}`)}
                    alt={slide.title || 'Promotional Banner'}
                    className="hero-swiper-img"
                    draggable={false}
                  />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* 2. CATEGORY TEXT SLIDER */}
      {!categoriesLoading && categories.length > 0 && (
        <section className="border-bottom border-top py-0 position-relative" style={{ zIndex: 10, backgroundColor: '#F8FAFC' }}>
          <Container>
            <div className="position-relative px-md-5">
              <Swiper
                modules={[Navigation, A11y]}
                navigation={{
                  prevEl: '.cat-prev',
                  nextEl: '.cat-next',
                }}
                spaceBetween={0}
                slidesPerView="auto"
                className="category-text-swiper"
                style={{ width: '100%' }}
              >
                {/* SHOP NOW / ALL link with slanted background */}
                <SwiperSlide style={{ width: 'auto' }}>
                  <Link href="/shop" className="text-decoration-none">
                    <div className="shop-now-tab">
                      <span>SHOP NOW</span>
                    </div>
                  </Link>
                </SwiperSlide>

                {categories.map((cat) => (
                  <SwiperSlide key={cat._id || cat.slug} style={{ width: 'auto' }}>
                    <Link href={`/shop?category=${cat.slug}`} className="text-decoration-none">
                      <div className="category-text-item" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <span>{cat.name}</span>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
              
              {/* Navigation Arrows (Mobile Only) */}
              <button className="cat-prev position-absolute start-0 top-50 translate-middle-y d-md-none" style={{ zIndex: 12, left: '5px' }}>
                <FiChevronLeft size={18} />
              </button>
              <button className="cat-next position-absolute end-0 top-50 translate-middle-y d-md-none" style={{ zIndex: 12, right: '5px' }}>
                <FiChevronRight size={18} />
              </button>
            </div>
          </Container>
        </section>
      )}

      {/* 3. featured / TRENDING PRODUCTS */}
      <section className="py-5 bg-white">
        <Container>
          <div className="d-flex justify-content-between align-items-end mb-5">
            <div>
              <h2 className="fw-bold" style={{ color: 'var(--primary-navy)' }}>Trending Collection</h2>
              <p className="text-muted mb-0">Hot apparel selling right now in Bangladesh</p>
            </div>
            <Link href="/shop" passHref legacyBehavior>
              <Button variant="link" className="text-danger fw-bold text-decoration-none">View All Products →</Button>
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
        </Container>
      </section>

      {/* New Arrivals Section */}
      <section className="py-5 bg-light border-top">
        <Container>
          <div className="d-flex justify-content-between align-items-end mb-5">
            <div>
              <h2 className="fw-bold" style={{ color: 'var(--primary-navy)' }}>New Arrivals</h2>
              <p className="text-muted mb-0">Discover the latest additions to our collection</p>
            </div>
            <Link href="/shop?sort=newest" passHref legacyBehavior>
              <Button variant="link" className="text-danger fw-bold text-decoration-none">View All New →</Button>
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
        </Container>
      </section>

      {/* 4. DESIGN CTA INTERACTIVE BANNER */}
      <section className="py-5 bg-navy-gradient text-white">
        <Container>
          <div className="glass-panel p-5 bg-dark bg-opacity-20 border-0 rounded-4">
            <Row className="align-items-center text-md-start text-center">
              <Col md={8}>
                <h3 className="fw-bold text-white mb-2 d-flex align-items-center gap-2 justify-content-center justify-content-md-start">
                  <IoSparkles color="yellow" /> WEAR YOUR CREATIVITY
                </h3>
                <h2 className="display-5 fw-extrabold text-white mb-3">Custom T-Shirt Printing Studio</h2>
                <p className="text-secondary mb-4 fs-6" style={{ color: '#94A3B8' }}>
                  Upload high-res PNG files, write custom slogans in elegant script typography, align layers, and review pricing in real time inside our HTML5 Canvas designer. Premium cotton 180+ GSM T-Shirts.
                </p>
              </Col>
              <Col md={4} className="text-md-end text-center">
                <Link href="/design" passHref legacyBehavior>
                  <Button variant="danger" className="btn-premium-accent btn-lg px-5 py-3">
                    Launch Canvas Editor
                  </Button>
                </Link>
              </Col>
            </Row>
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
