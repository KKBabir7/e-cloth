'use client';


import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BrandLoader from '../../components/BrandLoader';
import { Container, Row, Col, Card, Button, Modal } from 'react-bootstrap';
import { IoHeart, IoTrashOutline, IoCartOutline, IoHeartOutline } from 'react-icons/io5';
import { FiZoomIn } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { getBackendUrl, getProductImageUrl } from '../../utils/api';
import { removeFromWishlist } from '../../store/wishlistSlice';
import { addToCart, updateCartQty } from '../../store/cartSlice';
import { useUI } from '../../context/UIContext';
import axios from 'axios';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { showToast, openOptionsModal } = useUI();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);
  const isInCart = (id) => cartItems?.some((item) => item.productId === id);
  const [mounted, setMounted] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <BrandLoader fullPage={true} transparent={false} />;
  }

  const handleMoveToCart = async (item) => {
    try {
      showToast('Loading product options...', 'info');
      const res = await axios.get(`${getBackendUrl()}/api/products/${item.id}`);
      if (res.data.success) {
        const product = res.data.product;
        openOptionsModal(product, (selections) => {
          const existingItem = cartItems?.find(
            (cItem) =>
              cItem.productId.toString() === product._id.toString() &&
              cItem.size === selections.size &&
              cItem.color === selections.color
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
          dispatch(removeFromWishlist(item.id));
          showToast(`${product.name} added to cart!`, 'success');
        });
      } else {
        throw new Error('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product variants:', err);
      showToast('Could not load options. Adding with defaults.', 'error');
      dispatch(addToCart({
        productId: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        size: 'L',
        color: '#000000',
        quantity: 1,
        isCustom: false
      }));
      dispatch(removeFromWishlist(item.id));
      showToast(`${item.name} added to cart!`, 'success');
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <Container className="py-5 text-center" style={{ minHeight: '60vh' }}>
        <div className="py-5">
          <IoHeartOutline size={80} className="text-muted mb-4 opacity-50" />
          <h2 className="fw-bold mb-3" style={{ color: 'var(--primary-navy)' }}>Your Wishlist is Empty</h2>
          <p className="text-muted mb-4">Add your favorite traditional apparel designs to read/save them later.</p>
          <Link href="/shop" passHref legacyBehavior>
            <Button variant="danger" className="btn-premium-accent btn-lg px-5">Browse Shop Collection</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ minHeight: '75vh' }}>
      <h2 className="fw-bold mb-5" style={{ color: 'var(--primary-navy)' }}>
        My <span style={{ color: 'var(--accent-red)' }}>Wishlist</span>
      </h2>

      <Row className="g-2 g-md-3">
        {wishlistItems.map((item) => (
          <Col lg={3} md={6} xs={6} key={item.id}>
            <div className="custom-card d-flex flex-column h-100">
              <div className="product-image-container position-relative overflow-hidden">
                <Link href={`/product/${item.id}`}>
                  <Card.Img
                    variant="top"
                    src={getProductImageUrl(item.image)}
                    alt={item.name}
                    className="primary-img"
                  />
                </Link>
                <button
                  onClick={() => dispatch(removeFromWishlist(item.id))}
                  className="position-absolute border-0 rounded-circle d-flex align-items-center justify-content-center wishlist-float-btn"
                  title="Remove from wishlist"
                >
                  <IoTrashOutline size={16} color="#DC2626" />
                </button>

                {/* Zoom Floating Button */}
                <button
                  onClick={() => setZoomImage(getProductImageUrl(item.image))}
                  className="position-absolute border-0 rounded-circle d-flex align-items-center justify-content-center zoom-float-btn"
                  title="Zoom Image"
                >
                  <FiZoomIn size={16} color="#475569" />
                </button>
              </div>

              <div className="product-details d-flex flex-column flex-grow-1">
                <Link href={`/product/${item.id}`} className="text-decoration-none">
                  <h4 className="product-card-title text-truncate">
                    {item.name}
                  </h4>
                </Link>

                {/* Price and Actions Section */}
                <div className="d-flex align-items-center justify-content-between mt-auto pt-1">
                  {/* Price */}
                  <div className="d-flex align-items-baseline gap-1">
                    <span className="product-card-price">৳{item.price}</span>
                  </div>

                  {/* Actions */}
                  <div className="d-flex align-items-center">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className={`card-action-btn ${isInCart(item.id) ? 'active' : ''}`}
                      title="Move to Cart"
                    >
                      <IoCartOutline size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        ))}
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
