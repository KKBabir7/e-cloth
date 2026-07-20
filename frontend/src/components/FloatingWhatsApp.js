'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { IoLogoWhatsapp } from 'react-icons/io5';

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Do not show on administrative pages or the design page
  if (pathname && (pathname.startsWith('/admincloth') || pathname === '/design')) {
    return null;
  }

  const whatsappNumber = '8801999999999'; // matches hotline
  const message = encodeURIComponent("Hello CustomWear BD, I'd like to check about a product custom design order.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-whatsapp-trigger"
        aria-label="Chat with us on WhatsApp"
      >
        <IoLogoWhatsapp size={26} />
        <span className="floating-whatsapp-tooltip">Chat with Us</span>
      </a>

      <style jsx global>{`
        .floating-whatsapp-trigger {
          position: fixed;
          bottom: 92px;
          right: 24px;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: #FFFFFF;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          box-shadow: 0 10px 25px rgba(37, 211, 102, 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          text-decoration: none !important;
        }

        .floating-whatsapp-trigger:hover {
          transform: scale(1.1) translateY(-3px);
          box-shadow: 0 12px 30px rgba(37, 211, 102, 0.45);
          color: #FFFFFF !important;
        }

        /* Tooltip style */
        .floating-whatsapp-tooltip {
          position: absolute;
          right: 70px;
          background-color: var(--primary-navy, #0F172A);
          color: #FFFFFF;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .floating-whatsapp-trigger:hover .floating-whatsapp-tooltip {
          opacity: 1;
          visibility: visible;
          right: 68px;
        }

        /* Optional pulse effect */
        .floating-whatsapp-trigger::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid #25D366;
          border-radius: 50%;
          animation: whatsapp-pulse 2s infinite;
          opacity: 0;
          z-index: -1;
        }

        @keyframes whatsapp-pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
