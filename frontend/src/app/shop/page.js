'use client';


import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BrandLoader from '../../components/BrandLoader';
import { Container, Row, Col, Form, Badge, Modal } from 'react-bootstrap';
import { IoCartOutline, IoHeartOutline, IoHeart, IoFilterOutline, IoSearch, IoCloseOutline, IoStorefrontOutline } from 'react-icons/io5';
import { FiZoomIn } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../../store/wishlistSlice';
import { addToCart, updateCartQty } from '../../store/cartSlice';
import { useUI } from '../../context/UIContext';
import axios from 'axios';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getBackendUrl, getProductImageUrl } from '@/utils/api';
import CustomSelect from '../../components/CustomSelect';

// Main component with Suspense boundary wrapping Client filters
export default function ShopPage() {
  return (
    <Suspense fallback={<BrandLoader fullPage={true} transparent={false} />}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { showToast, openOptionsModal } = useUI();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);
  const [zoomImage, setZoomImage] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Parse filters from URL Search Params
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [availability, setAvailability] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  // Products infinite scroll
  const loadMoreRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  const prevCategoryRef = useRef(selectedCategory);

  // Sync state with URL updates
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setLocalSearch(searchParam);
    setDebouncedSearch(searchParam);
  }, [categoryParam, searchParam]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [localSearch]);

  // ── Categories via React Query (Dynamic and Real-time synced) ───────────
  const { data: categoriesData } = useQuery({
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
  const categoriesList = categoriesData || [];

  const {
    data: productsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', 'shop', selectedCategory, debouncedSearch, priceRange, selectedSize, availability, sortParam],
    queryFn: async ({ pageParam = 1 }) => {
      let query = `${getBackendUrl()}/api/products?page=${pageParam}&limit=6&sort=${sortParam}`;
      if (selectedCategory) query += `&category=${selectedCategory}`;
      if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (priceRange != null) query += `&maxPrice=${priceRange}`;
      if (selectedSize) query += `&size=${selectedSize}`;
      if (availability) query += `&availability=${availability}`;

      const res = await axios.get(query);
      if (res.data.success) {
        return {
          products: res.data.products,
          totalPages: res.data.pages,
          totalProducts: res.data.total,
          priceBounds: res.data.priceBounds || { min: 0, max: 5000 },
          page: pageParam,
        };
      }
      throw new Error('Not successful');
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined
    ),
  });

  const products = productsData?.pages.flatMap((page) => page.products) ?? [];
  const totalProducts = productsData?.pages[0]?.totalProducts ?? 0;
  const firstPageBounds = productsData?.pages[0]?.priceBounds;

  const catalogMin = Math.max(0, Math.floor((firstPageBounds?.min ?? 0) / 50) * 50);
  const catalogMax = Math.max(
    catalogMin + 50,
    Math.ceil((firstPageBounds?.max ?? 5000) / 50) * 50
  );
  const sliderValue = priceRange ?? catalogMax;

  // Sync slider to catalog max on load & when category changes
  useEffect(() => {
    if (!firstPageBounds) return;

    const max = Math.max(
      catalogMin + 50,
      Math.ceil((firstPageBounds.max || 5000) / 50) * 50
    );
    const categoryChanged = prevCategoryRef.current !== selectedCategory;
    prevCategoryRef.current = selectedCategory;

    setPriceRange((prev) => {
      if (prev == null || categoryChanged) return max;
      return Math.min(prev, max);
    });
  }, [selectedCategory, firstPageBounds, catalogMin]);

  // Infinite scroll — load next page when sentinel enters viewport
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: '240px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, products.length]);

  const updateUrlParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    const queryString = params.toString();
    router.push(queryString ? `/shop?${queryString}` : '/shop');
  };

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

  const clearAllFilters = () => {
    setSelectedCategory('');
    setPriceRange(catalogMax);
    setSelectedSize('');
    setAvailability('');
    setLocalSearch('');
    router.push('/shop');
  };

  const isInWishlist = (id) => wishlistItems.some((item) => item.id === id);
  const isInCart = (id) => cartItems?.some((item) => item.productId === id);

  const activeCategoryName = selectedCategory
    ? (categoriesList.find(c => c.slug === selectedCategory)?.name || selectedCategory)
    : '';

  const filterPanel = (
    <div className="shop-filter-panel">
      <div className="shop-filter-header">
        <h5 className="shop-filter-title">
          <IoFilterOutline /> Filters
        </h5>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="shop-filter-clear" onClick={clearAllFilters}>
            Clear All
          </button>
          <button
            type="button"
            className="shop-filter-close d-lg-none"
            onClick={() => setShowFilters(false)}
            aria-label="Close filters"
          >
            <IoCloseOutline size={20} />
          </button>
        </div>
      </div>

      {/* 1. Category */}
      <div className="shop-filter-section">
        <span className="shop-filter-label">Category</span>
        {categoriesList.map((cat) => (
          <Form.Check
            key={cat._id || cat.slug}
            type="radio"
            id={`cat-${cat.slug}`}
            name="categoryRadio"
            label={cat.name}
            checked={selectedCategory === cat.slug}
            onChange={() => updateUrlParam('category', cat.slug)}
            className="shop-filter-check mb-2"
          />
        ))}
      </div>

      {/* 2. Price Range */}
      <div className="shop-filter-section">
        <span className="shop-filter-label d-flex justify-content-between align-items-center">
          <span>Max Price</span>
          <span className="shop-price-value">৳{sliderValue}</span>
        </span>
        <Form.Range
          className="shop-range"
          min={catalogMin}
          max={catalogMax}
          step={50}
          value={sliderValue}
          onChange={(e) => setPriceRange(Number(e.target.value))}
        />
        <div className="d-flex justify-content-between shop-range-bounds">
          <span>৳{catalogMin}</span>
          <span>৳{catalogMax}</span>
        </div>
      </div>

      {/* 3. Sizes */}
      <div className="shop-filter-section">
        <span className="shop-filter-label">Size Selection</span>
        <div className="d-flex flex-wrap gap-2">
          {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
            <button
              type="button"
              key={size}
              onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
              className={`shop-size-btn${selectedSize === size ? ' active' : ''}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Availability */}
      <div className="shop-filter-section shop-filter-section--last">
        <span className="shop-filter-label">Availability</span>
        <Form.Check
          type="checkbox"
          id="stock-in"
          label="In Stock"
          checked={availability === 'inStock'}
          onChange={() => setAvailability(availability === 'inStock' ? '' : 'inStock')}
          className="shop-filter-check mb-2"
        />
        <Form.Check
          type="checkbox"
          id="stock-out"
          label="Out of Stock"
          checked={availability === 'outOfStock'}
          onChange={() => setAvailability(availability === 'outOfStock' ? '' : 'outOfStock')}
          className="shop-filter-check"
        />
      </div>

      <button type="button" className="shop-filter-apply d-lg-none" onClick={() => setShowFilters(false)}>
        Show {totalProducts} Results
      </button>
    </div>
  );

  if (!isMounted) {
    return <BrandLoader fullPage={true} transparent={false} />;
  }

  return (
    <Container className="py-4 py-lg-5 shop-page">
      {/* Page Heading */}
      <div className="shop-page-header">
        <span className="shop-header-eyebrow">
          <IoStorefrontOutline size={15} /> {activeCategoryName || 'All Products'}
        </span>
        <h1 className="shop-header-title">
          {activeCategoryName ? `${activeCategoryName} Collection` : 'Premium Apparel Catalog'}
        </h1>
        <p className="shop-header-sub">
          Explore high-quality clothing, traditional Punjabis, custom T-shirts, and premium accessories.
        </p>
      </div>

      <Row className="gy-4 shop-grid">

        {/* LEFT FILTER SIDEBAR */}
        <Col lg={3} className="shop-sidebar-col">
          {/* Backdrop for mobile drawer */}
          {showFilters && <div className="shop-filter-backdrop d-lg-none" onClick={() => setShowFilters(false)} />}
          <div className={`shop-filter-col${showFilters ? ' show' : ''}`}>
            {filterPanel}
          </div>
        </Col>

        {/* TOP SORT BAR & PRODUCT LIST GRID */}
        <Col lg={9} className="shop-content-col">
          <div className="d-flex flex-column gap-4">

            {/* Top Sort Header */}
            <div className="shop-toolbar">
              <div className="shop-toolbar-count">
                <span className="shop-toolbar-count-prefix">Showing </span><span>{products.length}</span> of <span>{totalProducts}</span> items
              </div>

              <button
                type="button"
                className="shop-filter-trigger d-lg-none"
                onClick={() => setShowFilters(true)}
                aria-label="Filters & Sort"
                title="Filters & Sort"
              >
                <IoFilterOutline size={20} />
              </button>

              <div className="shop-toolbar-sort" style={{ minWidth: '180px' }}>
                <span className="shop-toolbar-sort-label">Sort By</span>
                <CustomSelect
                  value={sortParam}
                  options={[
                    { value: 'newest', label: 'New Arrivals' },
                    { value: 'popular', label: 'Popularity' },
                    { value: 'priceLowHigh', label: 'Price: Low to High' },
                    { value: 'priceHighLow', label: 'Price: High to Low' }
                  ]}
                  onChange={(val) => updateUrlParam('sort', val)}
                  hasSearch={false}
                />
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <Row className="g-2 g-md-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Col key={i} md={4} sm={6} xs={6}>
                    <div className="shop-skeleton-card">
                      <div className="skeleton shop-skeleton-img" />
                      <div className="skeleton mb-2" style={{ height: '16px', width: '80%' }} />
                      <div className="skeleton" style={{ height: '18px', width: '50%' }} />
                    </div>
                  </Col>
                ))}
              </Row>
            ) : error ? (
              <div className="shop-state-panel">
                <div className="shop-state-icon shop-state-icon--error">
                  <IoStorefrontOutline size={28} />
                </div>
                <h5 className="shop-state-title">Unable to Load Products</h5>
                <p className="shop-state-text">
                  We couldn't load apparel items right now. Please ensure the backend is connected and try again.
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="shop-state-panel">
                <div className="shop-state-icon">
                  <IoSearch size={28} />
                </div>
                <h5 className="shop-state-title">No Products Found</h5>
                <p className="shop-state-text">Try adjusting your filters or search terms.</p>
                <button type="button" className="shop-state-btn" onClick={clearAllFilters}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <Row className="g-2 g-md-3">
                  {products.map((product) => {
                    const isDiscounted = product.discountPrice > 0;
                    const discountPercent = isDiscounted ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
                    
                    return (
                      <Col key={product._id} md={4} sm={6} xs={6}>
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
                            {product.stock === 0 && (
                              <Badge bg="secondary" className="position-absolute px-3 py-2" style={{ top: '12px', left: '12px', zIndex: 10 }}>
                                Out of Stock
                              </Badge>
                            )}
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
                                  <IoCartOutline size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>

                {/* Infinite scroll sentinel */}
                <div ref={loadMoreRef} className="shop-load-more-sentinel">
                  {isFetchingNextPage && (
                    <div className="shop-load-more-spinner">
                      <span className="shop-load-more-dot" />
                      <span className="shop-load-more-dot" />
                      <span className="shop-load-more-dot" />
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </Col>

      </Row>
      
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

    </Container>
  );
}
