'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container, Row, Col, Image } from 'react-bootstrap';
import { IoLogoFacebook, IoLogoInstagram, IoLogoYoutube, IoMail, IoPhonePortrait, IoLocation } from 'react-icons/io5';

export default function Footer() {
  const pathname = usePathname();

  // Hide corporate footer in administrative directories
  if (pathname && pathname.startsWith('/admincloth')) {
    return null;
  }

  return (
    <footer className="bg-white text-dark py-5 mt-auto" style={{ borderTop: '4px solid var(--accent-red)', boxShadow: '0 -10px 30px -10px rgba(28, 30, 35, 0.05)' }}>
      <Container>
        <Row className="gy-4">
          
          {/* Brand Info */}
          <Col lg={4} md={6}>
            <h5 className="fw-bold mb-3 text-dark">
              CUSTOMWEAR <span style={{ color: 'var(--accent-red)' }}>BD</span>
            </h5>
            <p className="text-secondary" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              Bangladesh's premier interactive ecommerce & custom apparel platform. We combine state-of-the-art web technology with high-grade locally sourced cotton to deliver state of the art custom T-shirts right to your doorstep.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-secondary-hover" style={{ color: 'var(--primary-navy)' }}>
                <IoLogoFacebook size={22} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-secondary-hover" style={{ color: 'var(--primary-navy)' }}>
                <IoLogoInstagram size={22} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-secondary-hover" style={{ color: 'var(--primary-navy)' }}>
                <IoLogoYoutube size={22} />
              </a>
            </div>
          </Col>

          {/* Quick Links */}
          <Col lg={2} md={6}>
            <h6 className="fw-bold text-dark mb-3">Quick Links</h6>
            <ul className="list-unstyled d-flex flex-column gap-2" style={{ fontSize: '14px' }}>
              <li>
                <Link href="/shop" className="text-secondary text-decoration-none hover-orange">Shop Catalog</Link>
              </li>
              <li>
                <Link href="/design" className="text-secondary text-decoration-none hover-orange">Design Custom Shirt</Link>
              </li>
              <li>
                <Link href="/about" className="text-secondary text-decoration-none hover-orange">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="text-secondary text-decoration-none hover-orange">Get in Touch</Link>
              </li>
            </ul>
          </Col>

          {/* Support & Policies */}
          <Col lg={2} md={6}>
            <h6 className="fw-bold text-dark mb-3">Customer Support</h6>
            <ul className="list-unstyled d-flex flex-column gap-2" style={{ fontSize: '14px' }}>
              <li>
                <Link href="/privacy-policy" className="text-secondary text-decoration-none hover-orange">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="text-secondary text-decoration-none hover-orange">Terms of Use</Link>
              </li>
              <li>
                <Link href="/shop?availability=inStock" className="text-secondary text-decoration-none hover-orange">FAQ & Exchanges</Link>
              </li>
            </ul>
          </Col>

          {/* Contact Details */}
          <Col lg={4} md={6}>
            <h6 className="fw-bold text-dark mb-3">Corporate Office</h6>
            <ul className="list-unstyled d-flex flex-column gap-3 text-secondary" style={{ fontSize: '14px' }}>
              <li className="d-flex align-items-center gap-2">
                <IoLocation size={20} className="text-danger" style={{ color: 'var(--accent-red)' }} />
                <span>House 45, Road 11, Banani, Dhaka - 1213, Bangladesh</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <IoPhonePortrait size={18} className="text-danger" style={{ color: 'var(--accent-red)' }} />
                <span>+880 1999 999 999 (Hotline 10AM - 8PM)</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <IoMail size={18} className="text-danger" style={{ color: 'var(--accent-red)' }} />
                <span>support@customwearbd.com</span>
              </li>
            </ul>
          </Col>

        </Row>

        <hr className="my-4 border-secondary opacity-25" style={{ borderColor: 'rgba(28, 30, 35, 0.12) !important' }} />

        {/* Payment Methods Section & Copyright */}
        <Row className="align-items-center gy-3">
          <Col md={6}>
            <p className="text-secondary mb-0" style={{ fontSize: '13px' }}>
              © {new Date().getFullYear()} CustomWear BD. All Rights Reserved. Crafted for premium retail commerce in Bangladesh.
            </p>
          </Col>
          <Col md={6} className="d-flex justify-content-md-end gap-3 align-items-center">
            <span className="text-secondary" style={{ fontSize: '12px', fontWeight: '500' }}>Secured Payments via:</span>
            <div className="d-flex gap-2">
              <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '11px', cursor: 'default' }}>bKash Verified</span>
              <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '11px', cursor: 'default' }}>Nagad Ready</span>
              <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '11px', cursor: 'default' }}>COD Available</span>
            </div>
          </Col>
        </Row>
      </Container>
      
      <style>{`
        .text-secondary {
          color: #475569 !important;
        }
        .hover-orange:hover {
          color: var(--accent-red) !important;
          transition: color 0.2s;
        }
        .text-secondary-hover:hover {
          color: var(--accent-red) !important;
          transform: translateY(-2px);
          transition: var(--transition-smooth);
        }
      `}</style>
    </footer>
  );
}
