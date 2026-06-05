'use client';

import React from 'react';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
import { IoShieldCheckmarkOutline, IoHeartOutline, IoShirtOutline } from 'react-icons/io5';

export default function AboutPage() {
  return (
    <Container className="py-5">
      <Card className="custom-card border-0 p-5 bg-white shadow-sm mb-4">
        <Card.Body>
          <div className="text-center mb-5">
            <h1 className="fw-extrabold display-5" style={{ color: 'var(--primary-navy)' }}>
              About <span className="text-danger">CustomWear BD</span>
            </h1>
            <div className="bg-danger mx-auto" style={{ width: '80px', height: '4px', borderRadius: '2px' }}></div>
            <p className="text-muted mt-3 fs-5">BD\'s Premium Custom T-Shirt Creator and E-Commerce Platform</p>
          </div>

          <Row className="gy-4 align-items-center mb-5">
            <Col lg={7}>
              <h3 className="fw-bold mb-3" style={{ color: 'var(--primary-navy)' }}>Who We Are</h3>
              <p className="text-muted" style={{ lineHeight: '1.8' }}>
                Founded in 2026, CustomWear BD is a tech-driven fashion platform serving the Bangladeshi market. We believe clothing is a form of self-expression. That is why we built a robust interactive drag-and-drop HTML5 design engine that lets anyone design, preview, and order personalized apparel with zero hassle.
              </p>
              <p className="text-muted" style={{ lineHeight: '1.8' }}>
                All our T-shirts are fabricated in local state of the art factories using 100% organic combed cotton, featuring double-stitch line neck collars, 180+ GSM thickness, and eco-friendly screen-printing inks that withstand washing without fading.
              </p>
            </Col>
            <Col lg={5} className="text-center">
              <img
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500"
                alt="Apparel Factory"
                className="img-fluid rounded shadow-lg"
                style={{ maxHeight: '300px', objectFit: 'cover' }}
              />
            </Col>
          </Row>

          <hr className="my-5" />

          {/* Pillars */}
          <Row className="g-4 text-center">
            {[
              { title: 'Premium Fabric', desc: '100% combed organic cotton 180+ GSM', icon: <IoShirtOutline size={32} className="text-danger" /> },
              { title: 'Secure Checkouts', desc: 'Secure bKash/Nagad mock integration and COD', icon: <IoShieldCheckmarkOutline size={32} className="text-danger" /> },
              { title: 'Love for Local Craft', desc: 'Proudly manufactured and printed in Bangladesh', icon: <IoHeartOutline size={32} className="text-danger" /> }
            ].map((p, idx) => (
              <Col key={idx} md={4}>
                <div className="p-4 bg-light rounded-4 h-100">
                  <div className="mb-3">{p.icon}</div>
                  <h5 className="fw-bold mb-2">{p.title}</h5>
                  <p className="text-muted small mb-0">{p.desc}</p>
                </div>
              </Col>
            ))}
          </Row>

        </Card.Body>
      </Card>
    </Container>
  );
}
