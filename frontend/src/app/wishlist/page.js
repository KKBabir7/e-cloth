'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { IoHeart, IoTrashOutline, IoCartOutline, IoHeartOutline } from 'react-icons/io5';
import { useSelector, useDispatch } from 'react-redux';
import { getProductImageUrl } from '../../utils/api';
import { removeFromWishlist } from '../../store/wishlistSlice';
import { addToCart } from '../../store/cartSlice';
import { useUI } from '../../context/UIContext';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { showToast } = useUI();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Container className="py-5 text-center" style={{ minHeight: '60vh' }}>
        <div className="py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-3 text-muted">Loading your premium wishlist...</p>
        </div>
      </Container>
    );
  }

  const handleMoveToCart = (item) => {
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
    showToast(`${item.name} moved to cart!`, 'success');
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
    <Container className="py-5">
      <h2 className="fw-bold mb-5" style={{ color: 'var(--primary-navy)' }}>
        My <span className="text-danger">Wishlist</span>
      </h2>

      <Row className="g-4">
        {wishlistItems.map((item) => (
          <Col lg={3} md={4} sm={6} key={item.id}>
            <Card className="custom-card h-100">
              <div className="position-relative overflow-hidden" style={{ height: '240px' }}>
                <Card.Img
                  variant="top"
                  src={getProductImageUrl(item.image)}
                  alt={item.name}
                  className="w-100 h-100 object-fit-cover scale-hover-img"
                />
                <button
                  onClick={() => dispatch(removeFromWishlist(item.id))}
                  className="position-absolute border-0 bg-white rounded-circle shadow p-2 d-flex align-items-center justify-content-center text-danger"
                  style={{ width: '36px', height: '36px', zIndex: 10, top: '12px', right: '12px' }}
                  title="Remove from wishlist"
                >
                  <IoTrashOutline size={18} />
                </button>
              </div>

              <Card.Body className="d-flex flex-column p-4">
                <Link href={`/product/${item.id}`} className="text-decoration-none">
                  <Card.Title className="fw-bold text-dark mt-1 text-truncate" style={{ fontSize: '15px', cursor: 'pointer' }}>
                    {item.name}
                  </Card.Title>
                </Link>

                <div className="d-flex align-items-center gap-2 my-2">
                  <span className="fw-extrabold text-danger fs-5">৳{item.price}</span>
                </div>

                <Button
                  onClick={() => handleMoveToCart(item)}
                  variant="dark"
                  className="w-100 mt-auto btn-premium-primary d-flex align-items-center justify-content-center gap-2"
                  size="sm"
                >
                  <IoCartOutline size={16} /> Move to Cart
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      <style>{`
        .scale-hover-img {
          transition: transform 0.5s ease;
        }
        .scale-hover-img:hover {
          transform: scale(1.08);
        }
      `}</style>
    </Container>
  );
}
