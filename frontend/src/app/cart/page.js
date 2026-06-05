'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
    return (
      <Container className="py-5 text-center" style={{ minHeight: '60vh' }}>
        <div className="py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-3 text-muted">Loading your premium shopping bag...</p>
        </div>
      </Container>
    );
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
      <Container className="py-5 text-center" style={{ minHeight: '60vh' }}>
        <div className="py-5">
          <IoShirtOutline size={80} className="text-muted mb-4 opacity-50" />
          <h2 className="fw-bold mb-3" style={{ color: 'var(--primary-navy)' }}>Your Shopping Cart is Empty</h2>
          <p className="text-muted mb-4">Discover our premium cotton shirts, polos, and panjabis collection.</p>
          <Link href="/shop" passHref legacyBehavior>
            <Button variant="danger" className="btn-premium-accent btn-lg px-5">Shop Our Collections</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-5" style={{ color: 'var(--primary-navy)' }}>Shopping Cart</h2>

      <Row className="gy-4">
        
        {/* LEFT SIDE: ITEMS LIST TABLE */}
        <Col lg={8}>
          <div className="glass-panel p-4 bg-white shadow-sm overflow-hidden">
            <Table responsive borderless className="align-middle mb-0">
              <thead className="border-bottom text-muted" style={{ fontSize: '13px' }}>
                <tr>
                  <th>Product Details</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-bottom-soft">
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={getProductImageUrl(item.image)}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-fit-cover rounded"
                          style={{ border: '1px solid #E2E8F0' }}
                        />
                        <div>
                          <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: '15px' }}>{item.name}</h6>
                          <div className="d-flex gap-2 align-items-center flex-wrap" style={{ fontSize: '12px' }}>
                            <span>Size: <strong className="text-dark">{item.size}</strong></span>
                            <span>|</span>
                            <span className="d-flex align-items-center gap-1">
                              Color: 
                              <span className="rounded-circle border" style={{ backgroundColor: item.color, width: '12px', height: '12px', display: 'inline-block' }} />
                            </span>
                            {item.isCustom && (
                              <>
                                <span>|</span>
                                <Badge bg="danger" className="bg-red-gradient">Customized Print</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center border rounded-3 bg-white" style={{ width: 'fit-content' }}>
                        <Button
                          variant="link"
                          className="text-decoration-none text-dark fw-bold px-2 py-0"
                          onClick={() => handleQtyChange(item, Math.max(1, item.quantity - 1))}
                        >
                          -
                        </Button>
                        <span className="px-2 fw-semibold" style={{ fontSize: '14px' }}>{item.quantity}</span>
                        <Button
                          variant="link"
                          className="text-decoration-none text-dark fw-bold px-2 py-0"
                          onClick={() => handleQtyChange(item, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </td>
                    <td className="fw-extrabold text-dark">
                      ৳{item.price * item.quantity}
                    </td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        className="text-danger p-2"
                        onClick={() => handleRemove(item)}
                        title="Remove product"
                      >
                        <IoTrashOutline size={20} />
                      </Button>
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
            <div className="glass-panel p-4 bg-white">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
                <IoGiftOutline /> Apply Promo Code
              </h6>
              
              {coupon ? (
                <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center" style={{ borderLeft: '4px solid #10B981' }}>
                  <div>
                    <span className="small text-muted d-block">Active Promotion:</span>
                    <strong className="text-success">{coupon.code}</strong>
                  </div>
                  <Button variant="outline-danger" size="sm" onClick={() => dispatch(removeCouponCode())}>
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
                    />
                    <Button type="submit" variant="dark" disabled={validatingCoupon || !couponInput.trim()} style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                      {validatingCoupon ? '...' : 'Apply'}
                    </Button>
                  </InputGroup>
                  <small className="text-muted mt-2 d-block">Use code **SUMMER30** for eid promotion (30% off checkout total).</small>
                </Form>
              )}
            </div>

            {/* Calculations Summary */}
            <div className="glass-panel p-4 bg-white">
              <h5 className="fw-bold mb-4" style={{ color: 'var(--primary-navy)' }}>Order Summary</h5>
              
              <div className="d-flex flex-column gap-3 mb-4" style={{ fontSize: '14.5px' }}>
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

                <hr className="my-1" />

                <div className="d-flex justify-content-between align-items-baseline">
                  <span className="fw-bold" style={{ fontSize: '16px' }}>Total Amount:</span>
                  <span className="fs-3 fw-extrabold text-danger">৳{total}</span>
                </div>
              </div>

              {/* Checkout Trigger */}
              <Button
                onClick={handleCheckout}
                variant="danger"
                className="w-100 btn-premium-accent py-3 justify-content-center bg-red-gradient"
              >
                <IoBagCheck size={20} /> Proceed To Checkout <IoArrowForward />
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
