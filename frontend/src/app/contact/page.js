'use client';

import React, { useState } from 'react';
import { Container, Card, Row, Col, Form, Button } from 'react-bootstrap';
import { IoMailOutline, IoCallOutline, IoLocationOutline, IoSendOutline } from 'react-icons/io5';
import { useUI } from '../../context/UIContext';

export default function ContactPage() {
  const { showToast } = useUI();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSending(true);
    setTimeout(() => {
      showToast('Support ticket dispatched successfully!', 'success');
      setName('');
      setEmail('');
      setMessage('');
      setSending(false);
    }, 1000);
  };

  return (
    <Container className="py-5">
      <Card className="custom-card border-0 p-5 bg-white shadow-sm">
        <Card.Body>
          <div className="text-center mb-5">
            <h1 className="fw-extrabold display-5" style={{ color: 'var(--primary-navy)' }}>
              Get in <span className="text-danger">Touch</span>
            </h1>
            <div className="bg-danger mx-auto" style={{ width: '80px', height: '4px', borderRadius: '2px' }}></div>
            <p className="text-muted mt-3 fs-5">We are here to assist with custom print bulk requests or orders</p>
          </div>

          <Row className="gy-4">
            
            {/* Left Column: Form */}
            <Col lg={7}>
              <h5 className="fw-bold mb-4">Send a Support Ticket</h5>
              <Form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Your Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control-premium"
                    required
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small fw-semibold">Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control-premium"
                    required
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small fw-semibold">Message Detail *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Enter details regarding custom prints, corporate bulk queries..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="form-control-premium"
                    required
                  />
                </Form.Group>

                <Button type="submit" disabled={sending} variant="danger" className="btn-premium-accent justify-content-center bg-red-gradient w-100 py-3">
                  <IoSendOutline /> {sending ? 'Dispatching...' : 'Send Message'}
                </Button>
              </Form>
            </Col>

            {/* Right Column: Office Metas */}
            <Col lg={5} className="border-start-lg ps-lg-4">
              <h5 className="fw-bold mb-4">Contact Information</h5>

              <div className="d-flex flex-column gap-4 text-muted" style={{ fontSize: '15px' }}>
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded bg-danger bg-opacity-10 text-danger p-2">
                    <IoLocationOutline size={20} />
                  </div>
                  <div>
                    <strong className="text-dark d-block mb-1">Corporate HQ</strong>
                    <span>House 45, Road 11, Banani, Dhaka - 1213, Bangladesh</span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="rounded bg-danger bg-opacity-10 text-danger p-2">
                    <IoCallOutline size={20} />
                  </div>
                  <div>
                    <strong className="text-dark d-block mb-1">Phone Helpline</strong>
                    <span>+880 1999 999 999 (Hotline 10AM - 8PM)</span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="rounded bg-danger bg-opacity-10 text-danger p-2">
                    <IoMailOutline size={20} />
                  </div>
                  <div>
                    <strong className="text-dark d-block mb-1">Email Support</strong>
                    <span>support@customwearbd.com</span>
                  </div>
                </div>
              </div>
            </Col>

          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
