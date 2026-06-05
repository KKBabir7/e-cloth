'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card, Table, Badge, Button, Row, Col } from 'react-bootstrap';
import { IoReceiptOutline, IoDownloadOutline, IoTimeOutline } from 'react-icons/io5';
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
        return <Badge bg="success">Delivered</Badge>;
      case 'Shipped':
        return <Badge bg="info">Shipped</Badge>;
      case 'Processing':
        return <Badge bg="primary">Processing</Badge>;
      case 'Cancelled':
        return <Badge bg="secondary">Cancelled</Badge>;
      case 'Pending':
      default:
        return <Badge bg="warning" text="dark">Pending Approval</Badge>;
    }
  };

  const getPaymentBadge = (status) => {
    if (status === 'Paid') return <Badge bg="success">Paid</Badge>;
    if (status === 'Failed') return <Badge bg="danger">Failed</Badge>;
    return <Badge bg="warning" text="dark">Unpaid</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm p-4 bg-white">
        {[1, 2].map(i => <div key={i} className="skeleton mb-3" style={{ height: '80px' }}></div>)}
      </Card>
    );
  }

  return (
    <Card className="custom-card border-0 p-4 shadow-sm bg-white">
      <Card.Body>
        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
          <IoReceiptOutline /> My Order History
        </h5>

        {orders.length === 0 ? (
          <div className="text-center py-5">
            <IoReceiptOutline size={48} className="text-muted mb-3 opacity-50" />
            <h6>No Orders Found</h6>
            <p className="text-muted small">You haven't placed any checkouts yet.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {orders.map((order) => (
              <div key={order._id} className="p-3 border rounded-3 bg-light">
                
                {/* Header */}
                <Row className="gy-2 align-items-center border-bottom pb-2 mb-3">
                  <Col md={4}>
                    <span className="small text-muted d-block">Order Reference:</span>
                    <strong className="text-dark" style={{ fontSize: '14.5px' }}>{order.orderId}</strong>
                  </Col>
                  <Col md={3}>
                    <span className="small text-muted d-block">Date Placed:</span>
                    <span className="fw-semibold text-dark">{new Date(order.createdAt).toLocaleDateString('en-BD')}</span>
                  </Col>
                  <Col md={2}>
                    <span className="small text-muted d-block">Payment ({order.paymentMethod}):</span>
                    {getPaymentBadge(order.paymentStatus)}
                  </Col>
                  <Col md={3} className="text-md-end">
                    <span className="small text-muted d-block mb-1">Status:</span>
                    {getStatusBadge(order.status)}
                  </Col>
                </Row>

                {/* Items loop */}
                <div className="d-flex flex-column gap-2 mb-3">
                  {order.products.map((item, idx) => (
                    <div key={idx} className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={getProductImageUrl(item.productId?.images?.[0])}
                          alt="product"
                          width={40}
                          height={40}
                          className="object-fit-cover rounded border"
                        />
                        <div>
                          <span className="fw-bold d-block" style={{ fontSize: '13px', maxWidth: '240px' }}>
                            {item.productId ? item.productId.name : 'Custom Designed T-Shirt'}
                          </span>
                          <span className="text-muted" style={{ fontSize: '11px' }}>Size: {item.size} x {item.quantity}</span>
                        </div>
                      </div>
                      <span className="fw-bold" style={{ fontSize: '13px' }}>৳{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Footer Invoice trigger */}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <div style={{ fontSize: '14.5px' }}>
                    Total Bill: <strong className="text-danger">৳{order.totalAmount}</strong>
                  </div>
                  {order.invoicePath && (
                    <a
                      href={order.invoicePath === '#' ? '#' : `${getBackendUrl()}${order.invoicePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-dark btn-sm d-flex align-items-center gap-2 rounded-3 px-3"
                    >
                      <IoDownloadOutline /> Download PDF Invoice
                    </a>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
