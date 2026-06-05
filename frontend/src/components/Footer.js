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
    <footer className="bg-navy-gradient text-light py-5 mt-auto" style={{ borderTop: '4px solid var(--accent-red)' }}>
      <Container>
        <Row className="gy-4">
          
          {/* Brand Info */}
          <Col lg={4} md={6}>
            <h5 className="fw-bold mb-3 text-white">
              CUSTOMWEAR <span style={{ color: 'var(--accent-red)' }}>BD</span>
            </h5>
            <p className="text-secondary" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              Bangladesh\'s premier interactive ecommerce & custom apparel platform. We combine state-of-the-art web technology with high-grade locally sourced cotton to deliver state of the art custom T-shirts right to your doorstep.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-secondary-hover" style={{ color: '#CBD5E1' }}>
                <IoLogoFacebook size={22} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-secondary-hover" style={{ color: '#CBD5E1' }}>
                <IoLogoInstagram size={22} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-secondary-hover" style={{ color: '#CBD5E1' }}>
                <IoLogoYoutube size={22} />
              </a>
            </div>
          </Col>

          {/* Quick Links */}
          <Col lg={2} md={6}>
            <h6 className="fw-bold text-white mb-3">Quick Links</h6>
            <ul className="list-unstyled d-flex flex-column gap-2" style={{ fontSize: '14px' }}>
              <li>
                <Link href="/shop" className="text-secondary text-decoration-none hover-white">Shop Catalog</Link>
              </li>
              <li>
                <Link href="/design" className="text-secondary text-decoration-none hover-white">Design Custom Shirt</Link>
              </li>
              <li>
                <Link href="/about" className="text-secondary text-decoration-none hover-white">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="text-secondary text-decoration-none hover-white">Get in Touch</Link>
              </li>
            </ul>
          </Col>

          {/* Support & Policies */}
          <Col lg={2} md={6}>
            <h6 className="fw-bold text-white mb-3">Customer Support</h6>
            <ul className="list-unstyled d-flex flex-column gap-2" style={{ fontSize: '14px' }}>
              <li>
                <Link href="/privacy-policy" className="text-secondary text-decoration-none hover-white">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="text-secondary text-decoration-none hover-white">Terms of Use</Link>
              </li>
              <li>
                <Link href="/shop?availability=inStock" className="text-secondary text-decoration-none hover-white">FAQ & Exchanges</Link>
              </li>
            </ul>
          </Col>

          {/* Contact Details */}
          <Col lg={4} md={6}>
            <h6 className="fw-bold text-white mb-3">Corporate Office</h6>
            <ul className="list-unstyled d-flex flex-column gap-3 text-secondary" style={{ fontSize: '14px' }}>
              <li className="d-flex align-items-center gap-2">
                <IoLocation size={20} className="text-danger" />
                <span>House 45, Road 11, Banani, Dhaka - 1213, Bangladesh</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <IoPhonePortrait size={18} className="text-danger" />
                <span>+880 1999 999 999 (Hotline 10AM - 8PM)</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <IoMail size={18} className="text-danger" />
                <span>support@customwearbd.com</span>
              </li>
            </ul>
          </Col>

        </Row>

        <hr className="my-4 border-secondary opacity-25" />

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
              <span className="badge bg-secondary px-2 py-1" style={{ fontSize: '11px', cursor: 'default' }}>bKash Verified</span>
              <span className="badge bg-secondary px-2 py-1" style={{ fontSize: '11px', cursor: 'default' }}>Nagad Ready</span>
              <span className="badge bg-danger px-2 py-1 bg-red-gradient" style={{ fontSize: '11px', cursor: 'default' }}>COD Available</span>
            </div>
          </Col>
        </Row>
      </Container>
      
      <style>{`
        .text-secondary {
          color: #94A3B8 !important;
        }
        .hover-white:hover {
          color: #FFFFFF !important;
          transition: color 0.2s;
        }
        .text-secondary-hover:hover {
          color: #FFFFFF !important;
          transform: translateY(-2px);
          transition: var(--transition-smooth);
        }
      `}</style>
    </footer>
  );
}
