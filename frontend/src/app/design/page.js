'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import BrandLoader from '../../components/BrandLoader';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Row, Col, Card, Button, Form, Tabs, Tab, Modal, InputGroup } from 'react-bootstrap';
import {
  IoText, IoImage, IoSquare, IoTrash, IoArrowDown, IoArrowUp, IoPushOutline,
  IoChevronDown, IoDownload, IoCart, IoReload, IoSave, IoSearch, IoMove
} from 'react-icons/io5';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/cartSlice';
import { useUI } from '../../context/UIContext';
import axios from 'axios';
import { getBackendUrl } from '@/utils/api';

// Main exported design customizer with Suspense boundary
export default function DesignStudio() {
  return (
    <Suspense fallback={<BrandLoader fullPage={true} transparent={false} />}>
      <DesignContent />
    </Suspense>
  );
}

function DesignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { showToast } = useUI();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const productId = searchParams.get('productId') || '';

  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [tshirtColor, setTshirtColor] = useState('#ffffff');
  const [activeTab, setActiveTab] = useState('text');
  const [tshirtView, setTshirtView] = useState('front'); // front or back
  const [selectedSize, setSelectedSize] = useState('L');

  // Text Form States
  const [textInput, setTextInput] = useState('CUSTOMWEAR');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Outfit');
  const [fontWeight, setFontWeight] = useState('normal');

  // Preview Modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewImgData, setPreviewImgData] = useState('');

  // Canvas State storage (front/back)
  const [frontDesignJson, setFrontDesignJson] = useState(null);
  const [backDesignJson, setBackDesignJson] = useState(null);

  // Initialize Fabric.js Canvas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically import Fabric to avoid SSR issues
    const fabric = require('fabric').fabric;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 240,
      height: 320,
      backgroundColor: 'transparent',
      selection: true
    });

    setCanvas(fabricCanvas);

    // Initial Welcome Text
    const text = new fabric.IText('Your Text', {
      left: 60,
      top: 130,
      fontSize: 24,
      fontFamily: 'Outfit',
      fill: '#000000',
      editable: true
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Sync canvas background view to toggle
  useEffect(() => {
    if (!canvas) return;
    
    // Save current view state before switching
    if (tshirtView === 'front') {
      setBackDesignJson(canvas.toJSON());
      if (frontDesignJson) {
        canvas.loadFromJSON(frontDesignJson, () => canvas.renderAll());
      } else {
        canvas.clear();
      }
    } else {
      setFrontDesignJson(canvas.toJSON());
      if (backDesignJson) {
        canvas.loadFromJSON(backDesignJson, () => canvas.renderAll());
      } else {
        canvas.clear();
      }
    }
  }, [tshirtView]);

  // Add Layer: Text
  const handleAddText = () => {
    if (!canvas) return;
    const fabric = require('fabric').fabric;
    const text = new fabric.IText(textInput, {
      left: 50,
      top: 100,
      fontFamily: fontFamily,
      fontSize: parseInt(fontSize),
      fill: textColor,
      fontWeight: fontWeight,
      editable: true
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    showToast('Text layer added!', 'success');
  };

  // Update Active Layer Text Styles
  useEffect(() => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'text')) {
      activeObj.set({
        fill: textColor,
        fontSize: parseInt(fontSize),
        fontFamily: fontFamily,
        fontWeight: fontWeight
      });
      canvas.renderAll();
    }
  }, [textColor, fontSize, fontFamily, fontWeight]);

  // Add Layer: Shape (Circle / Square / Star)
  const handleAddShape = (shapeType) => {
    if (!canvas) return;
    const fabric = require('fabric').fabric;
    let shape;

    if (shapeType === 'circle') {
      shape = new fabric.Circle({
        radius: 40,
        fill: '#dc2626',
        left: 80,
        top: 80
      });
    } else if (shapeType === 'square') {
      shape = new fabric.Rect({
        width: 80,
        height: 80,
        fill: '#0f172a',
        left: 80,
        top: 80
      });
    }
    
    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      showToast('Shape layer added!', 'success');
    }
  };

  // Add Layer: Upload Client Custom Image
  const handleImageUpload = (e) => {
    if (!canvas || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (f) => {
      const data = f.target.result;
      const fabric = require('fabric').fabric;
      
      fabric.Image.fromURL(data, (img) => {
        img.set({
          left: 40,
          top: 60,
          scaleX: 0.25,
          scaleY: 0.25
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        showToast('Image uploaded and placed!', 'success');
      });
    };
    reader.readAsDataURL(file);
  };

  // Layer Controls
  const handleLayerOrder = (action) => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) {
      showToast('Please select a layer first', 'info');
      return;
    }

    if (action === 'bringToFront') activeObj.bringToFront();
    else if (action === 'sendToBack') activeObj.sendToBack();
    else if (action === 'delete') canvas.remove(activeObj);
    
    canvas.renderAll();
  };

  // Export fully composite image (T-Shirt + Prints)
  const generatePreview = () => {
    if (!canvas) return '';

    // Create a temporary canvas in DOM to merge background shirt and prints
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 480;
    tempCanvas.height = 540;
    const ctx = tempCanvas.getContext('2d');

    // Draw shirt base color overlay
    ctx.fillStyle = tshirtColor;
    ctx.fillRect(0, 0, 480, 540);

    // Draw Mockup Outline frame (draw shirt silhouette shape or mock)
    ctx.fillStyle = '#e2e8f0';
    // Draw simplified mock shirt boundaries
    ctx.beginPath();
    ctx.moveTo(120, 20); // neck
    ctx.lineTo(360, 20);
    ctx.lineTo(460, 100); // sleeve right
    ctx.lineTo(400, 150);
    ctx.lineTo(380, 140);
    ctx.lineTo(380, 500); // body right
    ctx.lineTo(100, 500); // body left
    ctx.lineTo(100, 140);
    ctx.lineTo(80, 150);
    ctx.lineTo(20, 100); // sleeve left
    ctx.closePath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Draw Neck line collar circle
    ctx.beginPath();
    ctx.arc(240, 20, 40, 0, Math.PI);
    ctx.stroke();

    // Composite current prints absolute centered over chest
    const printsData = canvas.toDataURL({ format: 'png' });
    const img = new Image();
    img.src = printsData;
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Draw prints precisely on standard placement coordinates
        ctx.drawImage(img, 120, 100, 240, 320);
        resolve(tempCanvas.toDataURL('image/png'));
      };
    });
  };

  const handleOpenPreview = async () => {
    const dataUrl = await generatePreview();
    setPreviewImgData(dataUrl);
    setShowPreview(true);
  };

  const handleDownload = async () => {
    const dataUrl = await generatePreview();
    const link = document.createElement('a');
    link.download = `customwear-design-${tshirtView}.png`;
    link.href = dataUrl;
    link.click();
    showToast('Download started!', 'success');
  };

  // Add design directly to checkout cart
  const handleAddToCartWithDesign = async () => {
    if (!canvas) return;

    if (!isAuthenticated) {
      showToast('Please login to save and purchase custom designs', 'error');
      router.push('/login?redirect=/design');
      return;
    }

    try {
      showToast('Compiling custom layers and saving...', 'info');
      const previewImg = await generatePreview();
      const canvasJson = canvas.toJSON();

      // 1. Persist Custom Design layout in Backend DB
      const res = await axios.post(`${getBackendUrl()}/api/design/save`, {
        productId: productId || null,
        canvasJson,
        previewImage: previewImg
      });

      if (res.data.success) {
        const designRecord = res.data.design;

        // 2. Push Saved ID into global Redux Cart Slice
        dispatch(addToCart({
          productId: productId || 'custom-apparel-001',
          name: `Custom Premium T-Shirt (${tshirtColor === '#ffffff' ? 'White' : 'Colored'})`,
          price: 1100, // standard premium price point BDT 1100
          image: previewImg,
          size: selectedSize,
          color: tshirtColor,
          quantity: 1,
          isCustom: true,
          customDesignId: designRecord._id
        }));

        showToast('Custom T-Shirt added to cart!', 'success');
        router.push('/cart');
      }
    } catch (err) {
      console.error('Add custom cart error:', err);
      showToast('Error saving canvas configurations', 'error');
    }
  };

  return (
    <Container className="py-5">
      <Row className="gy-4">
        
        {/* LEFT TOOL PANEL */}
        <Col lg={3}>
          <div className="glass-panel p-3 bg-white h-100 d-flex flex-column gap-3">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
              <IoMove /> Tools Panel
            </h5>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 custom-design-tabs">
              
              {/* Text Layer Tab */}
              <Tab eventKey="text" title="Text">
                <Form className="d-flex flex-column gap-3 pt-2">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Text Content</Form.Label>
                    <Form.Control
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="form-control-premium"
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="small fw-semibold">Font Family</Form.Label>
                    <Form.Select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="form-control-premium"
                    >
                      <option value="Outfit">Outfit</option>
                      <option value="Impact">Impact (Bold Bold)</option>
                      <option value="Courier New">Courier (Retro)</option>
                      <option value="Times New Roman">Serif Elegant</option>
                    </Form.Select>
                  </Form.Group>

                  <Row>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Font Size</Form.Label>
                        <Form.Control
                          type="number"
                          value={fontSize}
                          onChange={(e) => setFontSize(e.target.value)}
                          className="form-control-premium"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Weight</Form.Label>
                        <Form.Select
                          value={fontWeight}
                          onChange={(e) => setFontWeight(e.target.value)}
                          className="form-control-premium"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group>
                    <Form.Label className="small fw-semibold">Font Color</Form.Label>
                    <InputGroup size="sm">
                      <Form.Control
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        style={{ height: '38px', padding: '2px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}
                      />
                      <Form.Control
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="form-control-premium"
                        style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Button onClick={handleAddText} variant="dark" className="btn-premium-primary justify-content-center w-100">
                    <IoText /> Add Text Layer
                  </Button>
                </Form>
              </Tab>

              {/* Graphics / Image uploads */}
              <Tab eventKey="image" title="Graphics">
                <div className="d-flex flex-column gap-3 pt-2">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Upload Local Image</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="form-control-premium"
                    />
                    <small className="text-muted d-block mt-1">Supports PNG with transparent backgrounds for clean printing.</small>
                  </Form.Group>

                  <hr className="my-2" />

                  <span className="small fw-semibold">Insert Geometric Shapes</span>
                  <div className="d-flex gap-2">
                    <Button variant="outline-dark" size="sm" onClick={() => handleAddShape('circle')} style={{ flex: 1 }}>
                      Circle
                    </Button>
                    <Button variant="outline-dark" size="sm" onClick={() => handleAddShape('square')} style={{ flex: 1 }}>
                      Square
                    </Button>
                  </div>
                </div>
              </Tab>
            </Tabs>

            <hr className="my-2" />

            {/* Canvas layer management */}
            <span className="small fw-semibold">Layer Hierarchies</span>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex gap-2">
                <Button variant="outline-dark" size="sm" onClick={() => handleLayerOrder('bringToFront')} style={{ flex: 1 }}>
                  <IoArrowUp /> Bring Up
                </Button>
                <Button variant="outline-dark" size="sm" onClick={() => handleLayerOrder('sendToBack')} style={{ flex: 1 }}>
                  <IoArrowDown /> Send Down
                </Button>
              </div>
              <Button variant="outline-danger" size="sm" onClick={() => handleLayerOrder('delete')} className="w-100">
                <IoTrash /> Delete Active Layer
              </Button>
            </div>

          </div>
        </Col>

        {/* CENTER INTERACTIVE T-SHIRT CANVAS */}
        <Col lg={6} className="text-center">
          <div className="glass-panel p-4 bg-white d-flex flex-column align-items-center justify-content-center relative" style={{ minHeight: '520px' }}>
            
            {/* Double-Sided view toggle switcher */}
            <div className="d-flex gap-2 mb-3 bg-light p-1 rounded-3">
              <Button
                variant={tshirtView === 'front' ? 'danger' : 'light'}
                onClick={() => setTshirtView('front')}
                size="sm"
                className="px-3"
              >
                Front Chest View
              </Button>
              <Button
                variant={tshirtView === 'back' ? 'danger' : 'light'}
                onClick={() => setTshirtView('back')}
                size="sm"
                className="px-3"
              >
                Back Silhouette View
              </Button>
            </div>

            {/* T-Shirt Canvas Composite Superimposition Frame */}
            <div className="position-relative shadow rounded-4 overflow-hidden" style={{
              width: '380px',
              height: '420px',
              backgroundColor: tshirtColor,
              transition: 'background-color 0.3s ease'
            }}>
              
              {/* T-Shirt mock frame outline vectors */}
              <div className="position-absolute w-100 h-100 top-0 start-0 pointer-events-none" style={{
                border: '14px solid rgba(15, 23, 42, 0.05)',
                backgroundImage: 'radial-gradient(circle at center, transparent 70%, rgba(0,0,0,0.08) 100%)',
                zIndex: 1
              }} />

              {/* Printable chest grid bounds marker */}
              <div className="position-absolute border border-dashed border-danger border-opacity-50" style={{
                width: '242px',
                height: '322px',
                top: '50px',
                left: '69px',
                zIndex: 2,
                pointerEvents: 'none'
              }}>
                <span className="position-absolute badge bg-danger opacity-75" style={{ fontSize: '8px', top: '4px', left: '4px' }}>Print Area</span>
              </div>

              {/* Absolute Canvas overlay wrapper */}
              <div className="position-absolute" style={{
                top: '50px',
                left: '69px',
                zIndex: 3
              }}>
                <canvas ref={canvasRef} />
              </div>

            </div>

            <small className="text-muted d-block mt-3">Select elements directly on shirt mock to scale, rotate, or edit text.</small>

          </div>
        </Col>

        {/* RIGHT CONTROL PANEL */}
        <Col lg={3}>
          <div className="glass-panel p-3 bg-white h-100 d-flex flex-column gap-3">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
              <IoSave /> Save & Export
            </h5>

            {/* 1. Base Shirt Palette colors */}
            <div className="mb-4">
              <span className="small fw-semibold d-block mb-2">Base Fabric Color</span>
              <div className="d-flex gap-2">
                {[
                  { name: 'White', hex: '#ffffff' },
                  { name: 'Black', hex: '#0f172a' },
                  { name: 'Crimson', hex: '#dc2626' },
                  { name: 'Royal Blue', hex: '#1e3a8a' },
                  { name: 'Navy Gray', hex: '#475569' }
                ].map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setTshirtColor(color.hex)}
                    className="rounded-circle border-0 shadow-sm"
                    style={{
                      backgroundColor: color.hex,
                      width: '32px',
                      height: '32px',
                      border: tshirtColor === color.hex ? '3px solid var(--accent-red)' : '1px solid #CBD5E1',
                      outline: 'none'
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* 2. Sizing variant picker */}
            <div className="mb-4">
              <span className="small fw-semibold d-block mb-2">Select Your Sizing</span>
              <div className="d-flex gap-2">
                {['M', 'L', 'XL', 'XXL'].map((s) => (
                  <Button
                    key={s}
                    variant={selectedSize === s ? 'danger' : 'outline-dark'}
                    onClick={() => setSelectedSize(s)}
                    size="sm"
                    style={{ flex: 1, borderRadius: '6px' }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Pricing details */}
            <div className="p-3 bg-light rounded-3 mb-4 text-center">
              <span className="text-muted d-block small">Premium Cotton 180 GSM print:</span>
              <span className="fs-3 fw-extrabold text-danger">৳1,100</span>
            </div>

            {/* Action buttons */}
            <div className="d-flex flex-column gap-2 mt-auto">
              <Button variant="outline-dark" className="btn-premium-outline justify-content-center" onClick={handleOpenPreview}>
                <IoPushOutline /> Full Screen Preview
              </Button>
              
              <Button variant="outline-dark" className="btn-premium-outline justify-content-center" onClick={handleDownload}>
                <IoDownload /> Download JPG Design
              </Button>
              
              <Button variant="danger" className="btn-premium-accent justify-content-center bg-red-gradient" onClick={handleAddToCartWithDesign}>
                <IoCart /> Buy Custom T-Shirt
              </Button>
            </div>

          </div>
        </Col>

      </Row>

      {/* FULLSCREEN PREVIEW MODAL */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Interactive Print Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          {previewImgData && (
            <img
              src={previewImgData}
              alt="fullscreen composite design preview"
              className="img-fluid rounded shadow"
              style={{ maxHeight: '420px', objectFit: 'contain' }}
            />
          )}
          <p className="text-muted mt-3 small">Realistic representation of fabric base texture and double-stitch borders.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowPreview(false)}>
            Close
          </Button>
          <Button variant="danger" size="sm" className="bg-red-gradient" onClick={handleDownload}>
            Download Composite PNG
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .custom-design-tabs .nav-link {
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-slate);
        }
        .custom-design-tabs .nav-link.active {
          color: var(--accent-red);
          font-weight: 600;
        }
        .pointer-events-none {
          pointer-events: none;
        }
      `}</style>
    </Container>
  );
}
