'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Row, Col, Button, Badge, Tab, Tabs, Image, Form } from 'react-bootstrap';
import { IoCart, IoHeartOutline, IoHeart, IoShirtOutline, IoCarOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ display: 'none' });

  // Reviews Module States
  const [reviewSort, setReviewSort] = useState('newest');
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data: product, isLoading, refetch } = useQuery({
    queryKey: ['product', params.id],
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/products/${params.id}`);
        if (res.data.success) {
          return res.data.product;
        }
        throw new Error('Not successful');
      } catch (err) {
        console.warn('Backend server unseeded or offline, falling back to mock product details');
        // Fallback premium details
        return {
          _id: params.id,
          name: 'Summer Breathable Solid Cotton T-Shirt',
          category: 'T-shirt',
          price: 750,
          discountPrice: 490,
          images: [
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop'
          ],
          stock: 45,
          variants: {
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            colors: ['#000000', '#ffffff', '#ff0000', '#0000ff']
          },
          description: 'Engineered with 100% premium combed organic cotton (180+ GSM), this crew-neck T-shirt offers unmatched comfort, shape retention, and durability. Pre-shrunk fabric to prevent sizing variations. Ideal for standard printing, custom lettering, or casual retail styling.',
          ratings: { average: 4.8, count: 24 }
        };
      }
    },
    enabled: !!params.id
  });

  // Reset selection when product changes
  useEffect(() => {
    setSelectedSize('');
    setSelectedColor('');
    setActiveImageIdx(0);
  }, [product?._id]);

  const handleZoomMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${getProductImageUrl(product.images[activeImageIdx])})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '200%'
    });
  };

  const handleZoomLeave = () => {
    setZoomStyle({ display: 'none' });
  };

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
      quantity: quantity,
      isCustom: false
    }));

    showToast(`${product.name} added to cart!`, 'success');
    if (redirectCheckout) {
      router.push('/checkout');
    }
  };

  const isInWishlist = () => wishlistItems.some((item) => item.id === product?._id);

  if (!mounted || isLoading) {
    return (
      <Container className="py-5">
        <Row className="gy-4">
          <Col md={6}>
            <div className="skeleton rounded-4 mb-3" style={{ height: '400px' }}></div>
            <div className="d-flex gap-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton rounded" style={{ height: '80px', width: '80px' }}></div>)}
            </div>
          </Col>
          <Col md={6}>
            <div className="skeleton mb-3" style={{ height: '35px', width: '70%' }}></div>
            <div className="skeleton mb-3" style={{ height: '20px', width: '30%' }}></div>
            <div className="skeleton mb-4" style={{ height: '100px' }}></div>
            <div className="skeleton mb-3" style={{ height: '40px', width: '50%' }}></div>
            <div className="skeleton" style={{ height: '50px' }}></div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!product) return <Container className="py-5 text-center"><h5>Product details unavailable</h5></Container>;

  return (
    <Container className="py-5">
      <Row className="gy-5">
        
        {/* Left Side: Zoom Gallery */}
        <Col lg={6}>
          <div className="d-flex flex-column gap-3">
            
            {/* Master Zoom Preview */}
            <div
              className="position-relative overflow-hidden rounded-4 border bg-white cursor-zoom"
              style={{ height: '450px' }}
              onMouseMove={handleZoomMove}
              onMouseLeave={handleZoomLeave}
            >
              <img
                src={getProductImageUrl(product.images[activeImageIdx])}
                alt={product.name}
                className="w-100 h-100 object-fit-contain"
              />
              
              {/* Zoom Panel overlay */}
              <div
                className="position-absolute w-100 h-100 top-0 start-0 pointer-events-none"
                style={{
                  ...zoomStyle,
                  backgroundColor: '#FFFFFF',
                  zIndex: 5
                }}
              />
            </div>

            {/* Thumbnail Navigations */}
            <div className="d-flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className="rounded border overflow-hidden p-1 bg-white"
                  style={{
                    width: '80px',
                    height: '80px',
                    cursor: 'pointer',
                    border: activeImageIdx === idx ? '2px solid var(--accent-red)' : '1px solid #E2E8F0'
                  }}
                >
                  <img src={getProductImageUrl(img)} alt="thumbnail" className="w-100 h-100 object-fit-cover" />
                </div>
              ))}
            </div>

          </div>
        </Col>

        {/* Right Side: Specifications & Variants */}
        <Col lg={6}>
          <div className="d-flex flex-column gap-3">
            
            {/* Title & Categories */}
            <div>
              <Badge bg="danger" className="mb-2 bg-red-gradient px-3 py-2 uppercase">{product.category}</Badge>
              <h1 className="fw-extrabold text-navy display-6" style={{ color: 'var(--primary-navy)', fontSize: '28px' }}>
                {product.name}
              </h1>
            </div>

            {/* Ratings Summary */}
            <div className="d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
              <span className="text-warning fw-bold">★ {product.ratings.average}</span>
              <span className="text-muted">({product.ratings.count} Verified Reviews)</span>
              <span className="text-secondary-emphasis">|</span>
              <Badge bg={product.stock > 0 ? 'success' : 'secondary'} className="px-2 py-1">
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </Badge>
            </div>

            {/* Pricing Section */}
            <div className="d-flex align-items-baseline gap-3 p-3 rounded-3 bg-light" style={{ borderLeft: '4px solid var(--accent-red)' }}>
              {product.discountPrice > 0 ? (
                <>
                  <span className="fs-3 fw-extrabold text-danger">৳{product.discountPrice}</span>
                  <span className="text-decoration-line-through text-muted fs-5">৳{product.price}</span>
                  <Badge bg="danger" className="bg-red-gradient">Save ৳{product.price - product.discountPrice}</Badge>
                </>
              ) : (
                <span className="fs-3 fw-extrabold text-navy" style={{ color: 'var(--primary-navy)' }}>৳{product.price}</span>
              )}
            </div>

            {/* Core Variant Selectors */}
            <Form className="my-2">
              
              {/* Color Selectors */}
              {product.variants?.colors?.length > 0 && (
                <div className="mb-3">
                  <span className="fw-bold d-block mb-2" style={{ fontSize: '14px' }}>Select Color:</span>
                  <div className="d-flex gap-2">
                    {product.variants.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          // Auto-switch to the mapped image for this color
                          const colorImgs = product.colorImages || {};
                          const mappedImg = colorImgs[color];
                          if (mappedImg) {
                            const imgIndex = product.images.indexOf(mappedImg);
                            setActiveImageIdx(imgIndex >= 0 ? imgIndex : 0);
                          }
                        }}
                        className="rounded-circle border-0 shadow-sm"
                        style={{
                          backgroundColor: color,
                          width: '32px',
                          height: '32px',
                          border: selectedColor === color ? '3px solid var(--accent-red)' : '1px solid #CBD5E1',
                          outline: selectedColor === color ? '2px solid var(--accent-red)' : 'none',
                          outlineOffset: '2px',
                          transition: 'outline 0.15s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selectors */}
              <div className="mb-4">
                <span className="fw-bold d-block mb-2" style={{ fontSize: '14px' }}>Select Size:</span>
                <div className="d-flex gap-2">
                  {product.variants?.sizes?.map((size) => (
                    <Button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      variant={selectedSize === size ? 'danger' : 'outline-dark'}
                      className="px-4"
                      size="sm"
                      style={{ borderRadius: '6px', minWidth: '48px' }}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quantity selectors */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <span className="fw-bold" style={{ fontSize: '14px' }}>Quantity:</span>
                <div className="d-flex align-items-center border rounded-3 bg-white">
                  <Button
                    variant="link"
                    className="text-decoration-none text-dark fw-bold px-3 py-1"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="px-3 fw-bold">{quantity}</span>
                  <Button
                    variant="link"
                    className="text-decoration-none text-dark fw-bold px-3 py-1"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

            </Form>

            {/* ACTION TRIGGER BUTTONS */}
            <div className="d-flex flex-column sm-flex-row gap-3">
              <Button
                onClick={() => handleAddToCart(false)}
                disabled={product.stock === 0}
                variant="dark"
                className="btn-premium-primary py-3 justify-content-center"
                style={{ flex: 1 }}
              >
                <IoCart size={20} /> Add to Cart
              </Button>
              
              <Button
                onClick={() => handleAddToCart(true)}
                disabled={product.stock === 0}
                variant="danger"
                className="btn-premium-accent py-3 justify-content-center bg-red-gradient"
                style={{ flex: 1 }}
              >
                Buy It Now
              </Button>
            </div>

            {/* CUSTOM T-SHIRT CUSTOMIZATION REDIRECT BRIDGE */}
            {product.category === 'T-shirt' && (
              <div className="mt-3 p-3 glass-panel text-center border-danger border-opacity-25" style={{ backgroundColor: 'rgba(239, 68, 68, 0.03)' }}>
                <h6 className="fw-bold text-danger mb-1 d-flex align-items-center justify-content-center gap-2">
                  <IoShirtOutline /> Want a personalized print?
                </h6>
                <p className="text-muted small mb-3">Add names, custom vectors, text, or sizing layers onto this mock.</p>
                <Button
                  onClick={() => router.push(`/design?productId=${product._id}`)}
                  variant="outline-danger"
                  className="w-100 fw-bold"
                  size="sm"
                >
                  👉 Click to Design Your Own T-Shirt
                </Button>
              </div>
            )}

            {/* Value Highlights */}
            <div className="d-flex flex-column gap-2 mt-4 pt-3 border-top" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              <div className="d-flex align-items-center gap-2">
                <IoCarOutline size={18} className="text-danger" />
                <span>Inside Dhaka delivery in 24-48 hours. Outside Dhaka in 3-4 days.</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <IoShieldCheckmarkOutline size={18} className="text-danger" />
                <span>100% Secure Payment processing (Simulated bKash/Nagad and COD support).</span>
              </div>
            </div>

          </div>
        </Col>

      </Row>

      {/* Dynamic Tab Panel guides */}
      <Row className="mt-5 pt-4">
        <Col>
          <Tabs defaultActiveKey="description" id="product-detail-tabs" className="mb-4">
            
            {/* Description tab */}
            <Tab eventKey="description" title="Description">
              <div className="p-3 bg-white rounded-3 shadow-sm product-description-wysiwyg" style={{ fontSize: '15px', lineHeight: '1.7' }}>
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
                
                {product.specifications && (
                  <div className="mt-4 pt-4 border-top">
                    <h6 className="fw-bold mb-3 text-dark">Specifications & Product Details:</h6>
                    <div dangerouslySetInnerHTML={{ __html: product.specifications }} />
                  </div>
                )}
              </div>
            </Tab>
            
            {/* Reviews tab */}
            <Tab eventKey="reviews" title={`Reviews (${product.ratings?.count || 0})`}>
              <div className="p-4 bg-white rounded-3 shadow-sm">
                <Row className="gy-4">
                  
                  {/* Left Column: Rating Breakdown Metrics */}
                  <Col md={5} className="border-end pe-md-4">
                    <h5 className="fw-bold mb-3">Customer Reviews</h5>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <span className="display-4 fw-extrabold text-dark">{product.ratings?.average || 0}</span>
                      <div>
                        <div className="text-warning fs-5">
                          {'★'.repeat(Math.round(product.ratings?.average || 0))}{'☆'.repeat(5 - Math.round(product.ratings?.average || 0))}
                        </div>
                        <span className="text-muted small">Based on {product.ratings?.count || 0} reviews</span>
                      </div>
                    </div>

                    {/* Progress bars */}
                    <div className="d-flex flex-column gap-2 mb-4">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = (product.reviews || []).filter(r => r.rating === stars).length;
                        const pct = product.reviews?.length > 0 ? (count / product.reviews.length) * 100 : 0;
                        return (
                          <div key={stars} className="d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
                            <span style={{ minWidth: '45px' }}>{stars} star</span>
                            <div className="progress flex-grow-1" style={{ height: '8px', backgroundColor: '#E2E8F0' }}>
                              <div 
                                className="progress-bar bg-warning" 
                                role="progressbar" 
                                style={{ width: `${pct}%`, borderRadius: '4px' }}
                                aria-valuenow={pct} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              />
                            </div>
                            <span className="text-muted" style={{ minWidth: '30px', textAlign: 'right' }}>{Math.round(pct)}%</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Write Review Section */}
                    <div className="p-3 border rounded-3 bg-light">
                      <h6 className="fw-bold mb-2">Share your thoughts</h6>
                      <p className="text-muted small mb-3">Rate and review this product to help other buyers make the right decision.</p>
                      
                      {/* Review form */}
                      <form onSubmit={handleReviewSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold">Your Rating *</Form.Label>
                          <div className="d-flex gap-2 align-items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                onClick={() => setNewReviewRating(star)}
                                style={{ cursor: 'pointer', fontSize: '24px', transition: 'transform 0.1s' }}
                                className={`review-star-clickable ${star <= newReviewRating ? 'text-warning' : 'text-muted'}`}
                                title={`${star} stars`}
                              >
                                {star <= newReviewRating ? '★' : '☆'}
                              </span>
                            ))}
                          </div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold">Your Name *</Form.Label>
                          <Form.Control 
                            type="text" 
                            required
                            placeholder="e.g. Tanvir Rahman"
                            value={newReviewName}
                            onChange={(e) => setNewReviewName(e.target.value)}
                            className="form-control-premium py-2"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold">Review Comment *</Form.Label>
                          <Form.Control 
                            as="textarea"
                            rows={3}
                            required
                            placeholder="Tell us what you liked or disliked about this product..."
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            className="form-control-premium"
                          />
                        </Form.Group>

                        <Button 
                          type="submit" 
                          variant="danger" 
                          disabled={submittingReview}
                          className="w-100 bg-red-gradient border-0 py-2 fw-bold"
                          style={{ fontSize: '13.5px' }}
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </form>
                    </div>
                  </Col>

                  {/* Right Column: Reviews List */}
                  <Col md={7} className="ps-md-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="fw-bold mb-0">Customer Reviews</h5>
                      <Form.Select
                        size="sm"
                        style={{ width: '150px', fontSize: '12px' }}
                        value={reviewSort}
                        onChange={(e) => setReviewSort(e.target.value)}
                        className="form-select-premium py-1"
                      >
                        <option value="newest">Newest First</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                      </Form.Select>
                    </div>

                    {(!product.reviews || product.reviews.length === 0) ? (
                      <div className="text-center py-5 border rounded-3 bg-light text-muted small">
                        No reviews yet for this product. Be the first to share your experience!
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3 overflow-y-auto" style={{ maxHeight: '600px', paddingRight: '8px' }}>
                        {sortedReviews.map((rev) => (
                          <div key={rev._id} className="p-3 border rounded-3 bg-light shadow-sm transition-smooth hover-shadow">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>{rev.name}</span>
                              <span className="text-warning">
                                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                              </span>
                            </div>
                            <div className="text-muted mb-2" style={{ fontSize: '11px' }}>
                              Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </div>
                            <p className="mb-0 text-muted small" style={{ lineHeight: '1.6' }}>
                              "{rev.comment}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Col>

                </Row>
              </div>
            </Tab>

            {/* Shipping tab */}
            <Tab eventKey="shipping" title="Shipping & Returns">
              <div className="p-3 bg-white rounded-3 shadow-sm product-description-wysiwyg" style={{ fontSize: '14.5px', lineHeight: '1.7' }}>
                {product.shippingReturns ? (
                  <div dangerouslySetInnerHTML={{ __html: product.shippingReturns }} />
                ) : (
                  <>
                    <h6 className="fw-bold">Bangladesh Delivery Charge details:</h6>
                    <ul>
                      <li>**Inside Dhaka:** Flat ৳80 (Dispatched via Paperfly/Pathao, arrives in 1-2 working days)</li>
                      <li>**Outside Dhaka:** Flat ৳150 (Dispatched via Steadfast/SA Paribahan, arrives in 3-4 working days)</li>
                    </ul>
                    <h6 className="fw-bold mt-4">7-Day Replacement Policy:</h6>
                    <p className="text-muted mb-0">We support full size-exchanges or print-error replacements within 7 days of delivery. Keep tags attached and clothes unwashed. Contact support for dispatch details.</p>
                  </>
                )}
              </div>
            </Tab>

            {/* Size tab */}
            <Tab eventKey="size-guide" title="Size Guide">
              <div className="p-3 bg-white rounded-3 shadow-sm product-description-wysiwyg">
                {product.sizeGuide ? (
                  <div dangerouslySetInnerHTML={{ __html: product.sizeGuide }} />
                ) : (
                  <table className="table table-bordered text-center" style={{ fontSize: '14px' }}>
                    <thead className="table-dark">
                      <tr>
                        <th>Size Label</th>
                        <th>Chest (inches)</th>
                        <th>Length (inches)</th>
                        <th>Sleeve Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>S</td>
                        <td>36 - 38</td>
                        <td>26.5</td>
                        <td>7.5</td>
                      </tr>
                      <tr>
                        <td>M</td>
                        <td>38 - 40</td>
                        <td>27.5</td>
                        <td>8.0</td>
                      </tr>
                      <tr>
                        <td>L</td>
                        <td>40 - 42</td>
                        <td>28.5</td>
                        <td>8.5</td>
                      </tr>
                      <tr>
                        <td>XL</td>
                        <td>42 - 44</td>
                        <td>29.5</td>
                        <td>9.0</td>
                      </tr>
                      <tr>
                        <td>XXL</td>
                        <td>44 - 46</td>
                        <td>30.5</td>
                        <td>9.5</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </Tab>

          </Tabs>
        </Col>
      </Row>

      <style>{`
        .cursor-zoom {
          cursor: zoom-in;
        }
        .pointer-events-none {
          pointer-events: none;
        }
        .product-description-wysiwyg ul, .product-description-wysiwyg ol {
          padding-left: 20px;
          margin-bottom: 16px;
          list-style-position: outside;
        }
        .product-description-wysiwyg ul {
          list-style-type: disc;
        }
        .product-description-wysiwyg ol {
          list-style-type: decimal;
        }
        .product-description-wysiwyg li {
          margin-bottom: 6px;
        }
        .product-description-wysiwyg table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
          background-color: #fff;
          font-size: 14.5px;
        }
        .product-description-wysiwyg th, .product-description-wysiwyg td {
          border: 1px solid #cbd5e1 !important;
          padding: 10px 14px !important;
          text-align: left;
        }
        .product-description-wysiwyg th {
          background-color: #f8fafc;
          font-weight: 700;
          color: #0f172a;
        }
        .product-description-wysiwyg tr:nth-child(even) {
          background-color: #f8fafc;
        }
      `}</style>
    </Container>
  );
}
