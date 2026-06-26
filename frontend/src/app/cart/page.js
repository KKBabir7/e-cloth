'use client';


import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BrandLoader from '../../components/BrandLoader';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Card, Table, Button, Form, Badge, InputGroup } from 'react-bootstrap';
import { IoTrashOutline, IoBagCheck, IoArrowForward, IoGiftOutline, IoShirtOutline, IoBagHandleOutline } from 'react-icons/io5';
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

  const renderCartProductCell = (item, compact = false) => (
    <div className={`d-flex align-items-start gap-3 ${compact ? 'cart-item-card-product' : ''}`}>
      <Link
        href={`/product/${item.productId}`}
        className="cart-image-wrapper rounded-3 overflow-hidden border bg-light shadow-sm text-decoration-none"
        style={{ width: compact ? '72px' : '80px', height: compact ? '88px' : '100px', flexShrink: 0 }}
      >
        <img
          src={getProductImageUrl(item.image)}
          alt={item.name}
          className="w-100 h-100 object-fit-cover"
        />
      </Link>
      <div className="min-w-0">
        <Link
          href={`/product/${item.productId}`}
          className="text-decoration-none text-dark"
        >
          <h6 className="fw-bold mb-2 cart-item-title" style={{ fontSize: compact ? '14px' : '15px', lineHeight: '1.4' }}>
            {item.name}
          </h6>
        </Link>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <span className="cart-attribute-badge d-inline-flex align-items-center justify-content-center">
            Size: <strong className="text-dark ms-1">{item.size}</strong>
          </span>
          <span className="cart-attribute-badge d-inline-flex align-items-center gap-1">
            Color:
            <span
              className="rounded-circle border ms-1"
              style={{ backgroundColor: item.color, width: '12px', height: '12px', display: 'inline-block' }}
            />
          </span>
          {item.isCustom && (
            <Badge bg="danger" className="bg-red-gradient border-0 py-1.5 px-2.5 rounded-2 text-white" style={{ fontSize: '10px', fontWeight: '600' }}>
              Custom Print
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  const renderCartQtyControl = (item) => (
    <div className="d-flex align-items-center gap-2 border rounded-pill bg-light p-1 cart-qty-control" style={{ width: 'fit-content' }}>
      <button
        type="button"
        className="cart-qty-btn border-0"
        onClick={() => handleQtyChange(item, Math.max(1, item.quantity - 1))}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="px-2 fw-bold text-dark cart-qty-value" style={{ fontSize: '13.5px', minWidth: '20px', textAlign: 'center' }}>
        {item.quantity}
      </span>
      <button
        type="button"
        className="cart-qty-btn border-0"
        onClick={() => handleQtyChange(item, item.quantity + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );

  const renderCartSubtotal = (item, mobile = false) => (
    <div className={mobile ? 'cart-item-card-subtotal' : undefined}>
      {mobile && <span className="cart-item-card-subtotal-label">Subtotal</span>}
      <span className="fw-extrabold" style={{ color: 'var(--primary-navy)', fontSize: mobile ? '16px' : '15px' }}>
        ৳{item.price * item.quantity}
      </span>
    </div>
  );

  const renderCartRemoveBtn = (item) => (
    <button
      type="button"
      className="cart-trash-btn border-0 flex-shrink-0"
      onClick={() => handleRemove(item)}
      title="Remove product"
      aria-label={`Remove ${item.name}`}
    >
      <IoTrashOutline size={18} />
    </button>
  );

  if (items.length === 0) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="cart-empty-card text-center">
          <span className="cart-empty-icon">
            <IoBagHandleOutline size={42} />
          </span>
          <h3 className="cart-empty-title">Your shopping bag is empty</h3>
          <p className="cart-empty-text">
            Looks like you haven't added anything yet. Explore our premium cotton collections and customize your own apparel.
          </p>
          <div className="cart-empty-actions">
            <Link href="/shop" className="cart-empty-btn-primary">
              Explore Collections <IoArrowForward size={18} />
            </Link>
            <Link href="/" className="cart-empty-btn-ghost">
              Back to Home
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4 py-md-5 cart-page">
      {/* Funnel Progress Steps */}
      <div className="checkout-steps-bar d-flex justify-content-center align-items-center mb-4 mb-md-5 flex-wrap">
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

      <Row className="gy-4 cart-row">
        
        {/* LEFT SIDE: ITEMS LIST TABLE */}
        <Col lg={8} className="order-2 order-lg-1 cart-bag-col">
          <div className="d-flex align-items-baseline gap-3 mb-4 flex-wrap">
            <h3 className="cart-bag-title fw-bold m-0" style={{ color: 'var(--primary-navy)', letterSpacing: '0.3px' }}>Your Shopping</h3>
            <span className="text-secondary fw-semibold">
              ({items.reduce((acc, item) => acc + item.quantity, 0)} {items.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'item' : 'items'})
            </span>
          </div>
          <div className="glass-panel cart-panel bg-white shadow-sm overflow-hidden border">
            {/* Desktop table */}
            <div className="d-none d-lg-block p-4">
              <Table borderless className="align-middle mb-0 cart-items-table">
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
                        {renderCartProductCell(item)}
                      </td>
                      <td>{renderCartQtyControl(item)}</td>
                      <td>{renderCartSubtotal(item)}</td>
                      <td className="text-end">{renderCartRemoveBtn(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="d-lg-none cart-items-mobile">
              {items.map((item, idx) => (
                <div key={idx} className="cart-item-card">
                  <div className="cart-item-card-main">
                    {renderCartProductCell(item, true)}
                    {renderCartRemoveBtn(item)}
                  </div>
                  <div className="cart-item-card-footer">
                    {renderCartQtyControl(item)}
                    {renderCartSubtotal(item, true)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
 
        {/* RIGHT SIDE: TOTAL BILLS SUMMARY & COUPON */}
        <Col lg={4} className="order-1 order-lg-2 cart-sidebar-col">
          <div className="d-flex flex-column gap-4 cart-sidebar-inner">
            
            {/* Promo coupon inputs */}
            <div className="glass-panel p-3 p-md-4 bg-white border cart-summary-panel cart-promo-panel">
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
            <div className="glass-panel p-3 p-md-4 bg-white border cart-summary-panel cart-order-panel">
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
                className="w-100 btn-premium-accent py-3 justify-content-center bg-red-gradient border-0 text-white rounded-3 fw-bold d-flex align-items-center gap-2 cart-checkout-btn"
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
        @media (max-width: 991.98px) {
          .cart-row {
            --bs-gutter-x: 0;
            --bs-gutter-y: 0;
            margin-top: 0;
          }
          .cart-sidebar-col,
          .cart-sidebar-inner {
            display: contents !important;
          }
          .cart-bag-col {
            order: 1;
            width: 100%;
          }
          .cart-order-panel {
            order: 2;
            width: 100%;
            margin-top: 1.5rem;
          }
          .cart-promo-panel {
            order: 3;
            width: 100%;
            margin-top: 1.5rem;
          }
        }
        @media (max-width: 575.98px) {
          .cart-bag-title {
            font-size: 1.25rem;
          }
          .cart-checkout-btn {
            padding-top: 0.6rem !important;
            padding-bottom: 0.6rem !important;
            font-size: 13.5px;
            gap: 0.4rem !important;
          }
          .cart-checkout-btn svg {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>
    </Container>
  );
}
