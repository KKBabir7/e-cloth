'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { IoColorPaletteOutline, IoCartOutline, IoEyeOutline } from 'react-icons/io5';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../store/cartSlice';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getBackendUrl, getProductImageUrl } from '@/utils/api';

export default function AccountDesignsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useUI();
  const { data: designsData, isLoading } = useQuery({
    queryKey: ['designs'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/design/user`);
        if (res.data.success) {
          return res.data.designs;
        }
        throw new Error('Not successful');
      } catch (err) {
        console.warn('Backend server unseeded or offline, falling back to mock designs list');
        return [];
      }
    }
  });

  const designs = designsData || [];

  const handleReAddToCart = (design) => {
    dispatch(addToCart({
      productId: design.productId?._id || 'custom-apparel-001',
      name: `Custom Designed T-Shirt (Saved ID)`,
      price: 1100,
      image: design.previewImage,
      size: 'L',
      color: '#ffffff',
      quantity: 1,
      isCustom: true,
      customDesignId: design._id
    }));
    showToast('Custom T-Shirt re-added to cart!', 'success');
    router.push('/cart');
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm p-4 bg-white">
        <div className="skeleton mb-3" style={{ height: '120px' }}></div>
      </Card>
    );
  }

  return (
    <Card className="custom-card border-0 p-4 shadow-sm bg-white">
      <Card.Body>
        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
          <IoColorPaletteOutline /> My Saved Custom Designs
        </h5>

        {designs.length === 0 ? (
          <div className="text-center py-5 bg-light rounded-3">
            <IoColorPaletteOutline size={48} className="text-muted mb-3 opacity-50" />
            <h6>No Saved Designs Found</h6>
            <p className="text-muted small">You haven't saved any custom T-shirt creations yet.</p>
            <Button variant="danger" size="sm" className="bg-red-gradient border-0 px-4 mt-2" onClick={() => router.push('/design')}>
              Launch Canvas Editor
            </Button>
          </div>
        ) : (
          <Row className="g-4">
            {designs.map((design) => (
              <Col md={4} sm={6} key={design._id}>
                <Card className="custom-card border shadow-sm">
                  <div className="position-relative overflow-hidden bg-light d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                    <img
                      src={getProductImageUrl(design.previewImage)}
                      alt="canvas preview"
                      className="w-100 h-100 object-fit-contain"
                    />
                  </div>
                  
                  <Card.Body className="p-3">
                    <span className="small text-muted d-block mb-2">Created: {new Date(design.createdAt).toLocaleDateString('en-BD')}</span>
                    <div className="d-flex gap-2">
                      <Button variant="outline-dark" size="sm" className="d-flex align-items-center justify-content-center p-2" onClick={() => handleReAddToCart(design)} title="Re-add to Cart" style={{ flex: 1 }}>
                        <IoCartOutline size={16} className="me-1" /> Re-Order
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}
