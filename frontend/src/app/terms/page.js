'use client';

import React from 'react';
import { Container, Card } from 'react-bootstrap';

export default function TermsPage() {
  return (
    <Container className="py-5">
      <Card className="custom-card border-0 p-5 bg-white shadow-sm">
        <Card.Body>
          <h1 className="fw-extrabold display-6 mb-4" style={{ color: 'var(--primary-navy)' }}>
            Terms of <span className="text-danger">Use</span>
          </h1>
          <div className="bg-danger mb-4" style={{ width: '60px', height: '4px', borderRadius: '2px' }}></div>
          
          <div className="text-muted" style={{ fontSize: '14.5px', lineHeight: '1.8' }}>
            <p>Welcome to CustomWear BD. These Terms of Use govern your access to and use of our e-commerce platform and custom design studio.</p>
            <h5 className="fw-bold text-dark mt-4">1. Custom Design Intellectual Property</h5>
            <p>By uploading custom graphic assets or writing text on our Fabric.js canvas mockups, you warrant that you own the rights to the uploaded elements or have secured necessary permissions. We reserve the right to cancel orders containing copyrighted or offensive prints.</p>
            <h5 className="fw-bold text-dark mt-4">2. Order Shipping and Delivery Limits</h5>
            <p>We process inside Dhaka and outside Dhaka shipments within standard time boundaries. Customers opting for Cash on Delivery (COD) must pay the delivery agent in full before receiving and unsealing packages.</p>
            <h5 className="fw-bold text-dark mt-4">3. simulated Mobile Gateways</h5>
            <p>Any bKash or Nagad wallet interaction executed on our simulator involves dummy payment tokens. No actual fiat funds are transacted or processed.</p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
