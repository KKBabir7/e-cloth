'use client';

import React from 'react';
import { Container, Card } from 'react-bootstrap';

export default function PrivacyPolicyPage() {
  return (
    <Container className="py-5">
      <Card className="custom-card border-0 p-5 bg-white shadow-sm">
        <Card.Body>
          <h1 className="fw-extrabold display-6 mb-4" style={{ color: 'var(--primary-navy)' }}>
            Privacy <span className="text-danger">Policy</span>
          </h1>
          <div className="bg-danger mb-4" style={{ width: '60px', height: '4px', borderRadius: '2px' }}></div>
          
          <div className="text-muted" style={{ fontSize: '14.5px', lineHeight: '1.8' }}>
            <p>At CustomWear BD, accessible from www.customwearbd.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by CustomWear BD and how we use it.</p>
            <h5 className="fw-bold text-dark mt-4">1. Information We Collect</h5>
            <p>We collect personal information that you provide, including your name, email, phone number, and delivery address during registration, checkout, or design saving stages.</p>
            <h5 className="fw-bold text-dark mt-4">2. How We Use Your Information</h5>
            <p>We use the collected details to process order shipments, manage mobile bank transaction confirmations, generate invoices, send tracking notices, and customize user account dashboards.</p>
            <h5 className="fw-bold text-dark mt-4">3. Data Security</h5>
            <p>All passwords are encrypted with bcrypt, and session authorization is managed using secure HTTP-Only cookies to protect your profile against unauthorized access.</p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
