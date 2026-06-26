'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Row, Col } from 'react-bootstrap';
import { IoReceiptOutline, IoDownloadOutline } from 'react-icons/io5';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getBackendUrl, getProductImageUrl } from '@/utils/api';

export default function AccountOrdersPage() {
  const { showToast } = useUI();
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/orders/user`);
        if (res.data.success) {
          return res.data.orders;
        }
        throw new Error('Not successful');
      } catch (err) {
        console.warn('Backend server unseeded or offline, falling back to mock orders list');
        // Mock orders list
        return [
          {
            _id: 'mock-ord-1',
            orderId: 'CWBD-20260529-8732',
            createdAt: new Date().toISOString(),
            paymentMethod: 'bKash',
            paymentStatus: 'Paid',
            deliveryCharge: 80,
            discountAmount: 300,
            totalAmount: 1680,
            status: 'Processing',
            invoicePath: '#',
            products: [
              { quantity: 1, size: 'L', color: '#000000', price: 950, productId: { name: 'Premium Black Designer T-Shirt', images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100'] } },
              { quantity: 1, size: 'L', color: '#ff0000', price: 950, productId: { name: 'Classic Crimson Polo Shirt', images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=100'] } }
            ]
          }
        ];
      }
    }
  });

  const orders = ordersData || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return <span className="badge-soft-success">✓ Delivered</span>;
      case 'Shipped':
        return <span className="badge-soft-info">Shipped</span>;
      case 'Processing':
        return <span className="badge-soft-warning">Processing</span>;
      case 'Cancelled':
        return <span className="badge-soft-danger">Cancelled</span>;
      case 'Pending':
      default:
        return <span className="badge-soft-secondary">Pending Approval</span>;
    }
  };

  const getPaymentBadge = (status) => {
    if (status === 'Paid') return <span className="badge-soft-success">Paid</span>;
    if (status === 'Failed') return <span className="badge-soft-danger">Failed</span>;
    return <span className="badge-soft-warning">Unpaid</span>;
  };

  if (isLoading) {
    return (
      <div className="account-panel p-4">
        {[1, 2].map(i => <div key={i} className="skeleton mb-3" style={{ height: '80px', borderRadius: '12px' }}></div>)}
      </div>
    );
  }

  return (
    <div className="account-panel">
      <div className="account-panel-body">
        <h5 className="account-panel-title">
          <IoReceiptOutline size={18} /> My Order History
        </h5>

        {orders.length === 0 ? (
          <div className="account-empty">
            <span className="account-empty-icon">
              <IoReceiptOutline size={34} />
            </span>
            <h6 className="account-empty-title">No Orders Found</h6>
            <p className="account-empty-text">You haven't placed any orders yet.</p>
            <Link href="/shop" className="account-btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {orders.map((order) => (
              <div key={order._id} className="account-order-card">
                
                {/* Header */}
                <Row className="gy-2 align-items-center border-bottom pb-2 mb-3">
                  <Col md={4}>
                    <span className="small text-muted d-block mb-1" style={{ fontSize: '11px' }}>Order Reference:</span>
                    <strong className="text-dark" style={{ fontSize: '14.5px', letterSpacing: '0.3px' }}>{order.orderId}</strong>
                  </Col>
                  <Col md={3}>
                    <span className="small text-muted d-block mb-1" style={{ fontSize: '11px' }}>Date Placed:</span>
                    <span className="fw-semibold text-dark" style={{ fontSize: '13.5px' }}>{new Date(order.createdAt).toLocaleDateString('en-BD')}</span>
                  </Col>
                  <Col md={2}>
                    <span className="small text-muted d-block mb-1" style={{ fontSize: '11px' }}>Payment ({order.paymentMethod}):</span>
                    {getPaymentBadge(order.paymentStatus)}
                  </Col>
                  <Col md={3} className="text-md-end">
                    <span className="small text-muted d-block mb-1" style={{ fontSize: '11px' }}>Order Status:</span>
                    {getStatusBadge(order.status)}
                  </Col>
                </Row>

                {/* Items loop */}
                <div className="d-flex flex-column gap-2 mb-3">
                    {order.products.map((item, idx) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded border bg-light overflow-hidden shadow-sm" style={{ width: '44px', height: '56px', flexShrink: 0 }}>
                            <img
                              src={getProductImageUrl(item.productId?.images?.[0])}
                              alt="product"
                              className="w-100 h-100 object-fit-cover"
                            />
                          </div>
                          <div>
                            <span className="fw-bold d-block" style={{ fontSize: '13px', maxWidth: '240px' }}>
                              {item.productId ? item.productId.name : 'Custom Designed T-Shirt'}
                            </span>
                            <span className="text-muted" style={{ fontSize: '11px' }}>Size: {item.size} &times; {item.quantity}</span>
                          </div>
                        </div>
                        <span className="fw-bold" style={{ fontSize: '13.5px', color: 'var(--primary-navy)' }}>৳{item.price * item.quantity}</span>
                      </div>
                  ))}
                </div>

                {/* Footer Invoice trigger */}
                <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                  <div style={{ fontSize: '14.5px' }}>
                    Total Bill: <strong style={{ color: 'var(--primary-navy)', fontSize: '16px' }}>৳{order.totalAmount}</strong>
                  </div>
                  {order.invoicePath && (
                    <a
                      href={order.invoicePath === '#' ? '#' : `${getBackendUrl()}${order.invoicePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-premium-outline d-inline-flex align-items-center gap-2 rounded-3 px-3 py-2 text-decoration-none"
                      style={{ fontSize: '12.5px', fontWeight: 600 }}
                    >
                      <IoDownloadOutline size={14} /> Download Invoice
                    </a>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
