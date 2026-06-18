'use client';


import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BrandLoader from '../../components/BrandLoader';
import { Container, Row, Col, Card, Button, Form, Badge, Pagination, Alert, Modal } from 'react-bootstrap';
import { IoCartOutline, IoHeartOutline, IoHeart, IoFilterOutline, IoSearch } from 'react-icons/io5';
import { FiZoomIn } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../../store/wishlistSlice';
import { addToCart, updateCartQty } from '../../store/cartSlice';
import { useUI } from '../../context/UIContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getBackendUrl, getProductImageUrl } from '@/utils/api';

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

  // Parse filters from URL Search Params
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = searchParams.get('page') || '1';
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState(3000);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [availability, setAvailability] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  // Products and Pagination States
  const [currentPage, setCurrentPage] = useState(1);

  // Sync state with URL updates
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setLocalSearch(searchParam);
    setDebouncedSearch(searchParam);
    setCurrentPage(parseInt(pageParam));
  }, [categoryParam, searchParam, pageParam]);

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

  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products', selectedCategory, debouncedSearch, priceRange, selectedSize, selectedColor, selectedRating, availability, sortParam, currentPage],
    queryFn: async () => {
      let query = `${getBackendUrl()}/api/products?page=${currentPage}&limit=9&sort=${sortParam}`;
      if (selectedCategory) query += `&category=${selectedCategory}`;
      if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (priceRange) query += `&maxPrice=${priceRange}`;
      if (selectedSize) query += `&size=${selectedSize}`;
      if (selectedColor) query += `&color=${encodeURIComponent(selectedColor)}`;
      if (selectedRating) query += `&rating=${selectedRating}`;
      if (availability) query += `&availability=${availability}`;

      const res = await axios.get(query);
      if (res.data.success) {
        return {
          products: res.data.products,
          totalPages: res.data.pages,
          totalProducts: res.data.total
        };
      }
      throw new Error('Not successful');
    },
    keepPreviousData: true
  });

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const totalProducts = productsData?.totalProducts || 0;

  const updateUrlParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && !(key === 'page' && value === '1')) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 (removing 'page' parameter) if changing a non-pagination filter
    if (key !== 'page') {
      params.delete('page');
      setCurrentPage(1);
    } else {
      setCurrentPage(Number(value));
    }
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
    setPriceRange(5000);
    setSelectedSize('');
    setSelectedColor('');
    setSelectedRating('');
    setAvailability('');
    setLocalSearch('');
    router.push('/shop');
  };

  const isInWishlist = (id) => wishlistItems.some((item) => item.id === id);
  const isInCart = (id) => cartItems?.some((item) => item.productId === id);

  return (
    <Container className="py-5">
      {/* Dynamic SEO-optimised Page Heading */}
      <div className="mb-4">
        <h1 className="fw-extrabold display-6 mb-1" style={{ color: 'var(--primary-navy)', fontFamily: "'Outfit', sans-serif" }}>
          {selectedCategory 
            ? `${categoriesList.find(c => c.slug === selectedCategory)?.name || selectedCategory} Collection` 
            : 'Premium Apparel Catalog'}
        </h1>
        <p className="text-muted mb-0" style={{ fontSize: '14.5px' }}>
          Explore high-quality clothing, traditional Punajbis, custom T-shirts, and premium accessories.
        </p>
      </div>

      <Row className="gy-4">
        
        {/* LEFT FILTER SIDEBAR */}
        <Col lg={3}>
          <div className="glass-panel p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
                <IoFilterOutline /> Filters
              </h5>
              <Button variant="link" size="sm" className="text-danger fw-semibold text-decoration-none p-0" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>

            {/* 1. Category */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold mb-2">Category</Form.Label>
              {categoriesList.map((cat) => (
                <Form.Check
                  key={cat._id || cat.slug}
                  type="radio"
                  id={`cat-${cat.slug}`}
                  name="categoryRadio"
                  label={cat.name}
                  checked={selectedCategory === cat.slug}
                  onChange={() => updateUrlParam('category', cat.slug)}
                  className="mb-2"
                />
              ))}
            </Form.Group>

            {/* 2. Price Range */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold mb-2 d-flex justify-content-between">
                <span>Max Price</span>
                <span className="text-danger fw-bold">৳{priceRange}</span>
              </Form.Label>
              <Form.Range
                min={300}
                max={5000}
                step={50}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
              />
              <div className="d-flex justify-content-between text-muted" style={{ fontSize: '11px' }}>
                <span>৳300</span>
                <span>৳5000</span>
              </div>
            </Form.Group>

            {/* 3. Sizes */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold mb-2">Size Selection</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <Button
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                    variant={selectedSize === size ? 'danger' : 'outline-dark'}
                    size="sm"
                    className="px-3"
                    style={{ minWidth: '40px', borderRadius: '6px' }}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </Form.Group>

            {/* 4. Colors */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold mb-2">Colors</Form.Label>
              <div className="d-flex gap-2">
                {[
                  { name: 'Black', hex: '#000000' },
                  { name: 'White', hex: '#ffffff' },
                  { name: 'Red', hex: '#ff0000' },
                  { name: 'Blue', hex: '#0000ff' },
                  { name: 'Yellow', hex: '#ffff00' }
                ].map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(selectedColor === color.hex ? '' : color.hex)}
                    className="rounded-circle border-0 shadow-sm"
                    style={{
                      backgroundColor: color.hex,
                      width: '28px',
                      height: '28px',
                      border: selectedColor === color.hex ? '3px solid var(--accent-red)' : '1px solid #CBD5E1',
                      outline: 'none'
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </Form.Group>

            {/* 5. Rating */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold mb-2">Ratings</Form.Label>
              {[4, 3].map((rate) => (
                <Form.Check
                  key={rate}
                  type="checkbox"
                  id={`rating-${rate}`}
                  label={`${rate} Star & Above`}
                  checked={selectedRating === rate.toString()}
                  onChange={() => setSelectedRating(selectedRating === rate.toString() ? '' : rate.toString())}
                  className="mb-2"
                />
              ))}
            </Form.Group>

            {/* 6. Availability */}
            <Form.Group className="mb-2">
              <Form.Label className="fw-bold mb-2">Availability</Form.Label>
              <Form.Check
                type="checkbox"
                id="stock-in"
                label="In Stock"
                checked={availability === 'inStock'}
                onChange={() => setAvailability(availability === 'inStock' ? '' : 'inStock')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="stock-out"
                label="Out of Stock"
                checked={availability === 'outOfStock'}
                onChange={() => setAvailability(availability === 'outOfStock' ? '' : 'outOfStock')}
              />
            </Form.Group>

          </div>
        </Col>

        {/* TOP SORT BAR & PRODUCT LIST GRID */}
        <Col lg={9}>
          <div className="d-flex flex-column gap-4">
            
            {/* Top Sort Header */}
            <div className="glass-panel p-3 bg-white d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                Showing <span className="fw-bold text-dark">{products.length}</span> of <span className="fw-bold text-dark">{totalProducts}</span> items
              </div>
              
              <div className="d-flex align-items-center gap-2">
                <span className="text-nowrap text-muted" style={{ fontSize: '14px' }}>Sort By:</span>
                <Form.Select
                  size="sm"
                  value={sortParam}
                  onChange={(e) => updateUrlParam('sort', e.target.value)}
                  style={{ width: '180px', borderRadius: '8px', padding: '6px 12px' }}
                >
                  <option value="newest">New Arrivals</option>
                  <option value="popular">Popularity</option>
                  <option value="priceLowHigh">Price: Low to High</option>
                  <option value="priceHighLow">Price: High to Low</option>
                </Form.Select>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <Row className="g-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Col key={i} md={4} sm={6}>
                    <Card className="border-0 shadow-sm rounded-4 p-3" style={{ height: '380px' }}>
                      <div className="skeleton rounded-4 mb-3" style={{ height: '220px' }}></div>
                      <div className="skeleton mb-2" style={{ height: '20px', width: '80%' }}></div>
                      <div className="skeleton mb-3" style={{ height: '15px', width: '50%' }}></div>
                      <div className="skeleton" style={{ height: '35px' }}></div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : error ? (
              <Alert variant="danger" className="text-center py-5 border-0 shadow-sm rounded-4 bg-white">
                <h5 className="fw-bold text-danger mb-2">Database Connection Failed</h5>
                <p className="text-muted mb-0 small">
                  We are unable to load apparel items right now. Please ensure the backend database is connected and active.
                </p>
              </Alert>
            ) : products.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                <IoSearch size={48} className="text-muted mb-3" />
                <h5 className="fw-bold">No Products Found</h5>
                <p className="text-muted">Try adjusting your filters or search terms.</p>
                <Button variant="danger" size="sm" onClick={clearAllFilters}>Reset Search</Button>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-5">
                    <Pagination>
                      <Pagination.Prev
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage(currentPage - 1);
                          updateUrlParam('page', (currentPage - 1).toString());
                        }}
                      />
                      {[...Array(totalPages)].map((_, idx) => (
                        <Pagination.Item
                          key={idx + 1}
                          active={currentPage === idx + 1}
                          onClick={() => {
                            setCurrentPage(idx + 1);
                            updateUrlParam('page', (idx + 1).toString());
                          }}
                        >
                          {idx + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage(currentPage + 1);
                          updateUrlParam('page', (currentPage + 1).toString());
                        }}
                      />
                    </Pagination>
                  </div>
                )}
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

      <style>{`
        .scale-hover-img {
          transition: transform 0.5s ease;
        }
       
      `}</style>
    </Container>
  );
}
