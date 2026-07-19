'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Modal } from 'react-bootstrap';
import { IoColorPaletteOutline, IoCartOutline, IoEyeOutline, IoTrashOutline } from 'react-icons/io5';
import Tshirt3DViewer from '../../../components/Tshirt3DViewer';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../store/cartSlice';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBackendUrl, getProductImageUrl } from '@/utils/api';

const DesignCard = ({ design, handleOpen3DPreview, handleReAddToCart, handleDelete, handleRedesign }) => {
  const [fCanvas, setFCanvas] = useState(null);
  const [bCanvas, setBCanvas] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    const fabric = require('fabric').fabric;
    const frontC = new fabric.StaticCanvas(null, { width: 240, height: 350 });
    const backC = new fabric.StaticCanvas(null, { width: 240, height: 350 });
    
    frontC.loadFromJSON(design.canvasJson.front, () => {
      frontC.renderAll();
      if (isMounted) setFCanvas(frontC);
    });
    backC.loadFromJSON(design.canvasJson.back, () => {
      backC.renderAll();
      if (isMounted) setBCanvas(backC);
    });
    
    return () => { isMounted = false; };
  }, [design]);

  return (
    <Card 
      className="custom-card border shadow-sm" 
      style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
      }}
    >
      <div className="position-relative overflow-hidden bg-light d-flex align-items-center justify-content-center" style={{ height: '240px', borderRadius: '4px 4px 0 0' }}>
        <Button 
          variant="danger" 
          size="sm" 
          className="position-absolute rounded-circle shadow p-0 d-flex align-items-center justify-content-center" 
          style={{ top: '10px', right: '10px', zIndex: 10, width: '32px', height: '32px', transition: 'transform 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(design._id);
          }}
          title="Delete Design"
        >
          <IoTrashOutline size={16} />
        </Button>
        {fCanvas && bCanvas ? (
          <Tshirt3DViewer 
            tshirtColor={design.tshirtColor || '#ffffff'}
            tshirtView="front"
            frontFabricCanvas={fCanvas}
            backFabricCanvas={bCanvas}
            visible={true}
            interactive={true}
            hideDecals={false}
            enableZoom={false}
            cameraZOffset={1.8}
            garmentType={design.garmentType || 'tshirt'}
          />
        ) : (
          <img
            src={getProductImageUrl(design.previewImage)}
            alt="canvas preview"
            className="w-100 h-100 object-fit-contain p-2"
          />
        )}
      </div>
      
      <Card.Body className="p-3">
        <span className="small text-muted d-block mb-3 fw-medium">Created: {new Date(design.createdAt).toLocaleDateString('en-BD')}</span>
        <div className="d-flex gap-1">
          <Button 
            size="sm" 
            className="d-flex align-items-center justify-content-center fw-semibold shadow-sm border-0" 
            style={{ flex: 1, padding: '6px 4px', transition: 'all 0.2s', backgroundColor: 'var(--primary-navy)', color: '#fff', whiteSpace: 'nowrap', fontSize: '11px' }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(57,22,26,0.3)'; e.currentTarget.style.backgroundColor = '#2a1013'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.backgroundColor = 'var(--primary-navy)'; }}
            onClick={() => handleOpen3DPreview(design)} 
            title="Full View" 
          >
            <IoEyeOutline size={14} className="me-1" /> View
          </Button>
          <Button 
            size="sm" 
            className="d-flex align-items-center justify-content-center fw-semibold text-white shadow-sm border-0" 
            style={{ flex: 1, padding: '6px 4px', transition: 'all 0.2s', backgroundColor: '#6366f1', whiteSpace: 'nowrap', fontSize: '11px' }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(99,102,241,0.3)'; e.currentTarget.style.backgroundColor = '#4f46e5'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.backgroundColor = '#6366f1'; }}
            onClick={() => handleRedesign(design)} 
            title="Redesign" 
          >
            <IoColorPaletteOutline size={14} className="me-1" /> Redesign
          </Button>
          <Button 
            size="sm" 
            className="d-flex align-items-center justify-content-center fw-semibold text-white shadow-sm border-0" 
            style={{ flex: 1, padding: '6px 4px', transition: 'all 0.2s', backgroundColor: 'var(--accent-red)', whiteSpace: 'nowrap', fontSize: '11px' }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(254,126,7,0.3)'; e.currentTarget.style.backgroundColor = 'var(--accent-red-hover)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.backgroundColor = 'var(--accent-red)'; }}
            onClick={() => handleReAddToCart(design)} 
            title="Re-add to Cart" 
          >
            <IoCartOutline size={14} className="me-1" /> Re-Order
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default function AccountDesignsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useUI();
  const queryClient = useQueryClient();
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

  const [selectedDesign, setSelectedDesign] = useState(null);
  const [show3DModal, setShow3DModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [designToDelete, setDesignToDelete] = useState(null);
  const [modalFrontCanvas, setModalFrontCanvas] = useState(null);
  const [modalBackCanvas, setModalBackCanvas] = useState(null);

  const handleOpen3DPreview = (design) => {
    setSelectedDesign(design);
    setShow3DModal(true);
    
    // dynamically load fabric to create static canvases
    const fabric = require('fabric').fabric;
    const fCanvas = new fabric.StaticCanvas(null, { width: 240, height: 350 });
    const bCanvas = new fabric.StaticCanvas(null, { width: 240, height: 350 });
    
    fCanvas.loadFromJSON(design.canvasJson.front, () => {
      fCanvas.renderAll();
      setModalFrontCanvas(fCanvas);
    });
    
    bCanvas.loadFromJSON(design.canvasJson.back, () => {
      bCanvas.renderAll();
      setModalBackCanvas(bCanvas);
    });
  };

  const handleClose3DPreview = () => {
    setShow3DModal(false);
    setSelectedDesign(null);
    setModalFrontCanvas(null);
    setModalBackCanvas(null);
  };

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

  const handleRedesign = (design) => {
    router.push(`/design?redesign=${design._id}`);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${getBackendUrl()}/api/design/${id}`);
    },
    onSuccess: () => {
      showToast('Design deleted successfully', 'success');
      queryClient.invalidateQueries(['designs']);
    },
    onError: () => {
      showToast('Failed to delete design', 'error');
    }
  });

  const handleDelete = (id) => {
    setDesignToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (designToDelete) {
      deleteMutation.mutate(designToDelete);
      setShowDeleteModal(false);
      setDesignToDelete(null);
    }
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
                <DesignCard 
                  design={design} 
                  handleOpen3DPreview={handleOpen3DPreview} 
                  handleReAddToCart={handleReAddToCart}
                  handleDelete={handleDelete}
                  handleRedesign={handleRedesign}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>

      {/* 3D PREVIEW MODAL */}
      <Modal show={show3DModal} onHide={handleClose3DPreview} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-slate-800">3D Design Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 bg-light rounded-bottom overflow-hidden position-relative" style={{ height: '520px' }}>
          {selectedDesign && modalFrontCanvas && modalBackCanvas ? (
            <Tshirt3DViewer 
              tshirtColor={selectedDesign.tshirtColor || '#ffffff'}
              tshirtView="front"
              frontFabricCanvas={modalFrontCanvas}
              backFabricCanvas={modalBackCanvas}
              visible={show3DModal}
              interactive={true}
              garmentType={selectedDesign.garmentType || 'tshirt'}
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100">
              <span className="text-muted fw-semibold">Rendering 3D Model...</span>
            </div>
          )}
          {/* Interactive hints watermark overlay */}
          <div className="position-absolute bottom-0 start-50 translate-middle-x pb-3 text-center pointer-events-none" style={{ zIndex: 10 }}>
            <span className="badge bg-dark bg-opacity-75 px-3 py-2 rounded-pill fw-semibold" style={{ fontSize: '11px' }}>
              👉 Drag to rotate • 🔍 Scroll to zoom in/out
            </span>
          </div>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h5 fw-semibold text-danger">Delete Design</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0 text-muted">Are you sure you want to delete this custom design? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="fw-medium px-4" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="fw-medium px-4 shadow-sm" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
