'use client';


import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BrandLoader from '../../components/BrandLoader';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Card, Table, Button, Form, Badge, InputGroup } from 'react-bootstrap';
import { IoTrashOutline, IoBagCheck, IoArrowForward, IoGiftOutline, IoShirtOutline } from 'react-icons/io5';
import { removeFromCart, updateCartQty, applyCouponCode, removeCouponCode } from '../../store/cartSlice';
import { useUI } from '../../context/UIContext';
import axios from 'axios';
import { getProductImageUrl } from '../../utils/api';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useUI();

  const { items, coupon, subtotal, discount, deliveryCharge, total } = useSelector((state) => state.cart);
  const [couponInput, setCouponInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <BrandLoader fullPage={true} transparent={false} />;
  }

  const handleQtyChange = (item, newQty) => {
    dispatch(updateCartQty({
      productId: item.productId,
      size: item.size,
      color: item.color,
      isCustom: item.isCustom,
      customDesignId: item.customDesignId,
      quantity: parseInt(newQty)
    }));
  };

  const handleRemove = (item) => {
    dispatch(removeFromCart({
      productId: item.productId,
      size: item.size,
      color: item.color,
      isCustom: item.isCustom,
      customDesignId: item.customDesignId
    }));
    showToast(`${item.name} removed from cart`, 'info');
  };

  // Submit and Validate Coupon code via API
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setValidatingCoupon(true);
    try {
      await dispatch(applyCouponCode({ code: couponInput.trim() })).unwrap();
      showToast('Promo code applied successfully!', 'success');
      setCouponInput('');
    } catch (err) {
      showToast(err || 'Invalid or expired coupon code', 'error');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <Container className="py-5 text-center d-flex align-items-center justify-content-center" style={{ minHeight: '65vh' }}>
        <div className="py-5 glass-panel p-5 bg-white shadow-sm" style={{ maxWidth: '500px' }}>
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4 bg-light shadow-sm" style={{ width: '100px', height: '100px', border: '1px solid #E2E8F0' }}>
            <IoShirtOutline size={48} style={{ color: 'var(--primary-navy)' }} />
          </div>
          <h3 className="fw-bold mb-2" style={{ color: 'var(--primary-navy)' }}>Your shopping bag is empty</h3>
          <p className="text-muted mb-4 px-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
            It looks like you haven't added any items to your cart yet. Explore our premium cotton collections and customize your own apparel.
          </p>
          <Link href="/shop" passHref legacyBehavior>
            <Button className="btn-premium-accent btn-lg px-5 border-0 text-white rounded-3 fw-bold d-inline-flex align-items-center gap-2">
              Explore Collections <IoArrowForward />
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Funnel Progress Steps */}
      <div className="checkout-steps-bar d-flex justify-content-center align-items-center mb-5 flex-wrap">
        <div className="checkout-step active">
          <span className="checkout-step-num">1</span>
          <span className="checkout-step-text">Shopping Bag</span>
        </div>
        <div className="checkout-step-line" />
        <div className="checkout-step">
          <span className="checkout-step-num">2</span>
          <span className="checkout-step-text">Checkout</span>
        </div>
        <div className="checkout-step-line" />
        <div className="checkout-step">
          <span className="checkout-step-num">3</span>
          <span className="checkout-step-text">Confirmation</span>
        </div>
      </div>

      <div className="d-flex align-items-baseline gap-3 mb-4 flex-wrap">
        <h3 className="fw-bold m-0" style={{ color: 'var(--primary-navy)', letterSpacing: '0.3px' }}>Your Shopping Bag</h3>
        <span className="text-secondary fw-semibold">
          ({items.reduce((acc, item) => acc + item.quantity, 0)} {items.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'item' : 'items'})
        </span>
      </div>

      <Row className="gy-4">
        
        {/* LEFT SIDE: ITEMS LIST TABLE */}
        <Col lg={8}>
          <div className="glass-panel p-4 bg-white shadow-sm overflow-hidden border">
            <Table responsive borderless className="align-middle mb-0">
              <thead className="border-bottom text-muted" style={{ fontSize: '12.5px' }}>
                <tr>
                  <th className="pb-3">Product Details</th>
                  <th className="pb-3">Quantity</th>
                  <th className="pb-3">Subtotal</th>
                  <th className="pb-3 text-end">Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-bottom-soft">
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="cart-image-wrapper rounded-3 overflow-hidden border bg-light shadow-sm" style={{ width: '80px', height: '100px', flexShrink: 0 }}>
                          <img
                            src={getProductImageUrl(item.image)}
                            alt={item.name}
                            className="w-100 h-100 object-fit-cover"
                          />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '15px', lineHeight: '1.4' }}>{item.name}</h6>
                          <div className="d-flex gap-2 align-items-center flex-wrap">
                            <span className="cart-attribute-badge d-inline-flex align-items-center justify-content-center">
                              Size: <strong className="text-dark ms-1">{item.size}</strong>
                            </span>
                            <span className="cart-attribute-badge d-inline-flex align-items-center gap-1">
                              Color: 
                              <span className="rounded-circle border ms-1" style={{ backgroundColor: item.color, width: '12px', height: '12px', display: 'inline-block' }} />
                            </span>
                            {item.isCustom && (
                              <Badge bg="danger" className="bg-red-gradient border-0 py-1.5 px-2.5 rounded-2 text-white" style={{ fontSize: '10px', fontWeight: '600' }}>
                                Custom Print
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2 border rounded-pill bg-light p-1" style={{ width: 'fit-content' }}>
                        <button
                          type="button"
                          className="cart-qty-btn border-0"
                          onClick={() => handleQtyChange(item, Math.max(1, item.quantity - 1))}
                        >
                          -
                        </button>
                        <span className="px-2 fw-bold text-dark" style={{ fontSize: '13.5px', minWidth: '20px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="cart-qty-btn border-0"
                          onClick={() => handleQtyChange(item, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="fw-extrabold" style={{ color: 'var(--primary-navy)', fontSize: '15px' }}>
                        ৳{item.price * item.quantity}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="cart-trash-btn border-0"
                        onClick={() => handleRemove(item)}
                        title="Remove product"
                      >
                        <IoTrashOutline size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>
 
        {/* RIGHT SIDE: TOTAL BILLS SUMMARY & COUPON */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-4">
            
            {/* Promo coupon inputs */}
            <div className="glass-panel p-4 bg-white border">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)', fontSize: '14.5px' }}>
                <IoGiftOutline size={18} /> Apply Promo Code
              </h6>
              
              {coupon ? (
                <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #10B981' }}>
                  <div>
                    <span className="small text-muted d-block" style={{ fontSize: '11px' }}>Active Promotion:</span>
                    <strong className="text-success" style={{ fontSize: '14px' }}>{coupon.code}</strong>
                  </div>
                  <Button variant="outline-danger" size="sm" className="rounded-2" style={{ fontSize: '12px' }} onClick={() => dispatch(removeCouponCode())}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Form onSubmit={handleApplyCoupon}>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="e.g. SUMMER30"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="form-control-premium"
                      disabled={validatingCoupon}
                      style={{ fontSize: '13.5px' }}
                    />
                    <Button type="submit" variant="dark" className="px-3" disabled={validatingCoupon || !couponInput.trim()} style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px', fontSize: '13.5px' }}>
                      {validatingCoupon ? '...' : 'Apply'}
                    </Button>
                  </InputGroup>
                  <div className="cart-coupon-disclaimer mt-3">
                    Use code <strong>SUMMER30</strong> for eid promotion (30% off checkout total).
                  </div>
                </Form>
              )}
            </div>
 
            {/* Calculations Summary */}
            <div className="glass-panel p-4 bg-white border">
              <h5 className="fw-bold mb-4" style={{ color: 'var(--primary-navy)', fontSize: '16px', letterSpacing: '0.3px' }}>Order Summary</h5>
              
              <div className="d-flex flex-column gap-3 mb-4" style={{ fontSize: '14px' }}>
                <div className="d-flex justify-content-between text-muted">
                  <span>Subtotal Amount:</span>
                  <span className="fw-bold text-dark">৳{subtotal}</span>
                </div>
 
                <div className="d-flex justify-content-between text-muted">
                  <span>Delivery Charge:</span>
                  <span className="fw-bold text-dark">৳{deliveryCharge}</span>
                </div>
 
                {coupon && (
                  <div className="d-flex justify-content-between text-success">
                    <span>Discount Applied ({coupon.code}):</span>
                    <span className="fw-bold">-৳{discount}</span>
                  </div>
                )}
 
                <hr className="my-2" />
 
                <div className="d-flex justify-content-between align-items-baseline">
                  <span className="fw-bold text-dark" style={{ fontSize: '15px' }}>Total Amount:</span>
                  <span className="fs-3 fw-extrabold" style={{ color: 'var(--primary-navy)' }}>৳{total}</span>
                </div>
              </div>
 
              {/* Checkout Trigger */}
              <Button
                onClick={handleCheckout}
                className="w-100 btn-premium-accent py-3 justify-content-center bg-red-gradient border-0 text-white rounded-3 fw-bold d-flex align-items-center gap-2"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <IoBagCheck size={20} /> Proceed to Checkout <IoArrowForward />
              </Button>
            </div>
 
          </div>
        </Col>
 
      </Row>
      
      <style>{`
        .border-bottom-soft {
          border-bottom: 1px solid #F1F5F9;
        }
      `}</style>
    </Container>
  );
}
