'use client';
import { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Spinner, Modal } from 'react-bootstrap';
import { IoArrowBackOutline, IoPersonOutline, IoShirtOutline, IoBrushOutline, IoDownload, IoEyeOutline } from 'react-icons/io5';
import axios from 'axios';
import { getBackendUrl } from '../../../../utils/api';
import { useUI } from '../../../../context/UIContext';
import { useRouter } from 'next/navigation';
import Tshirt3DViewer from '../../../../components/Tshirt3DViewer';

export default function CustomOrderDetails({ params }) {
  const { id } = params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fCanvas, setFCanvas] = useState(null);
  const [bCanvas, setBCanvas] = useState(null);
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const { showToast } = useUI();
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/custom-orders/admin/${id}`, { withCredentials: true });
        if (res.data.success) {
          setOrder(res.data.customOrder);
          initCanvases(res.data.customOrder.canvasJson);
        }
      } catch (err) {
        showToast('Failed to load order details', 'error');
        router.push('/admincloth/custom-orders');
      }
      setLoading(false);
    };
    fetchOrder();
  }, [id]);

  const initCanvases = (canvasJson) => {
    const fabric = require('fabric').fabric;
    const front = new fabric.StaticCanvas(null, { width: 240, height: 440 });
    const back = new fabric.StaticCanvas(null, { width: 240, height: 440 });
    
    front.loadFromJSON(canvasJson.front, () => {
      front.renderAll();
      setFCanvas(front);
    });
    back.loadFromJSON(canvasJson.back, () => {
      back.renderAll();
      setBCanvas(back);
    });
  };

  const renderLayerList = (objects, side) => {
    if (!objects || objects.length === 0) {
      return <div className="text-muted small py-1">No layers on {side} side</div>;
    }

    return (
      <div className="mb-3">
        <h6 className="fw-bold text-uppercase text-muted mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
          {side} Side ({objects.length} {objects.length === 1 ? 'layer' : 'layers'})
        </h6>
        <div className="d-flex flex-column gap-2">
          {objects.map((obj, index) => {
            const isText = obj.type === 'i-text' || obj.type === 'text';
            const isImg = obj.type === 'image';
            const isShape = ['rect', 'circle', 'triangle', 'ellipse', 'polygon', 'path'].includes(obj.type);
            
            let typeLabel = 'IMAGE';
            let badgeBg = 'success';
            if (isText) {
              typeLabel = 'TEXT';
              badgeBg = 'primary';
            } else if (isShape) {
              typeLabel = 'SHAPE';
              badgeBg = 'warning';
            } else if (obj.isSticker) {
              typeLabel = 'STICKER';
              badgeBg = 'info';
            }

            return (
              <div key={index} className="p-2.5 rounded border bg-white d-flex align-items-start gap-2.5" style={{ fontSize: '12px' }}>
                <Badge bg={badgeBg} className="text-white mt-0.5" style={{ fontSize: '8.5px', padding: '4px 6px', fontWeight: 'bold' }}>
                  {typeLabel}
                </Badge>
                
                <div className="flex-grow-1 min-w-0">
                  {isText ? (
                    <div>
                      <div className="fw-bold text-dark text-truncate mb-1" title={obj.text}>"{obj.text}"</div>
                      <div className="d-flex flex-wrap gap-x-2 gap-y-1 text-muted" style={{ fontSize: '10.5px', lineHeight: '1.4' }}>
                        <span>Font: <strong className="text-dark">{obj.fontFamily}</strong></span>
                        <span>Size: <strong className="text-dark">{obj.fontSize}px</strong></span>
                        <span className="d-flex align-items-center gap-1">
                          Color: 
                          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: obj.fill || '#000', border: '1px solid #ccc' }}></span>
                          <strong className="text-dark">{obj.fill || '#000'}</strong>
                        </span>
                        {obj.fontWeight && obj.fontWeight !== 'normal' && <span>Weight: <strong className="text-dark">{obj.fontWeight}</strong></span>}
                        {obj.fontStyle && obj.fontStyle !== 'normal' && <span>Style: <strong className="text-dark">{obj.fontStyle}</strong></span>}
                        {obj.charSpacing !== undefined && obj.charSpacing !== 0 && <span>Spacing: <strong className="text-dark">{obj.charSpacing}</strong></span>}
                        {obj.opacity !== undefined && obj.opacity < 1 && <span>Opacity: <strong className="text-dark">{(obj.opacity * 100).toFixed(0)}%</strong></span>}
                        {obj.strokeWidth !== undefined && obj.strokeWidth > 0 && (
                          <span className="d-flex align-items-center gap-1">
                            Border: <strong className="text-dark">{obj.strokeWidth}px</strong> 
                            <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: obj.stroke || '#fff', border: '1px solid #ccc' }}></span>
                            <strong className="text-dark">{obj.stroke}</strong>
                          </span>
                        )}
                        {obj.angle !== undefined && obj.angle !== 0 && <span>Rotation: <strong className="text-dark">{obj.angle.toFixed(0)}°</strong></span>}
                      </div>
                    </div>
                  ) : isShape ? (
                    <div>
                      <div className="fw-bold text-dark text-capitalize mb-1">{obj.type} Shape</div>
                      <div className="d-flex flex-wrap gap-x-2 gap-y-1 text-muted" style={{ fontSize: '10.5px', lineHeight: '1.4' }}>
                        <span className="d-flex align-items-center gap-1">
                          Fill: 
                          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: obj.fill || '#fff', border: '1px solid #ccc' }}></span>
                          <strong className="text-dark">{obj.fill || 'None'}</strong>
                        </span>
                        {obj.strokeWidth !== undefined && obj.strokeWidth > 0 && (
                          <span className="d-flex align-items-center gap-1">
                            Border: <strong className="text-dark">{obj.strokeWidth}px</strong> 
                            <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: obj.stroke || '#fff', border: '1px solid #ccc' }}></span>
                            <strong className="text-dark">{obj.stroke}</strong>
                          </span>
                        )}
                        <span>Scale: <strong className="text-dark">{obj.scaleX?.toFixed(2)}x</strong></span>
                        {obj.angle !== undefined && obj.angle !== 0 && <span>Rotation: <strong className="text-dark">{obj.angle.toFixed(0)}°</strong></span>}
                        {obj.opacity !== undefined && obj.opacity < 1 && <span>Opacity: <strong className="text-dark">{(obj.opacity * 100).toFixed(0)}%</strong></span>}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="fw-semibold text-dark mb-1">
                        {obj.isSticker ? 'Sticker Asset' : 'Uploaded Design'}
                      </div>
                      <div className="d-flex flex-wrap gap-x-2 gap-y-1 text-muted" style={{ fontSize: '10.5px', lineHeight: '1.4' }}>
                        <span>Scale: <strong className="text-dark">{obj.scaleX?.toFixed(2)}x</strong></span>
                        {obj.angle !== undefined && obj.angle !== 0 && <span>Rotation: <strong className="text-dark">{obj.angle.toFixed(0)}°</strong></span>}
                        {obj.opacity !== undefined && obj.opacity < 1 && <span>Opacity: <strong className="text-dark">{(obj.opacity * 100).toFixed(0)}%</strong></span>}
                        {(() => {
                          const filters = obj.filters || [];
                          const brightF = filters.find(f => f && (f.type === 'Brightness' || f.brightness !== undefined));
                          const contrastF = filters.find(f => f && (f.type === 'Contrast' || f.contrast !== undefined));
                          const saturationF = filters.find(f => f && (f.type === 'Saturation' || f.saturation !== undefined));
                          
                          const brightnessVal = brightF ? (brightF.brightness * 100).toFixed(0) : null;
                          const contrastVal = contrastF ? (contrastF.contrast * 100).toFixed(0) : null;
                          const saturationVal = saturationF ? (saturationF.saturation * 100).toFixed(0) : null;
                          
                          return (
                            <>
                              {brightnessVal && brightnessVal !== '0' && <span>Brightness: <strong className="text-dark">{brightnessVal}%</strong></span>}
                              {contrastVal && contrastVal !== '0' && <span>Contrast: <strong className="text-dark">{contrastVal}%</strong></span>}
                              {saturationVal && saturationVal !== '0' && <span>Saturation: <strong className="text-dark">{saturationVal}%</strong></span>}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {isImg && (
                  <div 
                    className="border rounded bg-light overflow-hidden d-flex align-items-center justify-content-center" 
                    style={{ width: '38px', height: '38px', flexShrink: 0, cursor: 'pointer' }}
                    onClick={() => setPreviewModalImg(obj.src || obj.stickerUrl)}
                    title="Click to view full image"
                  >
                    <img 
                      src={obj.src || obj.stickerUrl} 
                      alt="Design Layer" 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
  if (!order) return null;

  return (
    <div>
      <div className="d-flex align-items-center mb-4 gap-3">
        <Button variant="light" className="rounded-circle p-2" onClick={() => router.back()}>
          <IoArrowBackOutline size={20} />
        </Button>
        <h4 className="fw-bold m-0">Custom Order Details</h4>
        <Badge bg="info" className="ms-auto">Status: {order.status}</Badge>
      </div>

      <Row className="g-4">
        {/* Left Column - Details */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom py-3">
              <h6 className="m-0 fw-bold"><IoPersonOutline className="me-2" /> Customer Info</h6>
            </Card.Header>
            <Card.Body>
              <p className="mb-1"><strong>Name:</strong> {order.orderId?.shippingAddress?.name || order.userId?.name || 'Guest'}</p>
              <p className="mb-1"><strong>Phone:</strong> {order.orderId?.shippingAddress?.phone || order.userId?.phone || 'N/A'}</p>
              <p className="mb-2"><strong>Email:</strong> {order.userId?.email || 'N/A'}</p>
              {order.orderId?.shippingAddress && (
                <div className="mt-2 pt-2 border-top small text-muted">
                  <div className="fw-bold mb-1 text-dark">Shipping Address:</div>
                  <div>{order.orderId.shippingAddress.addressLine}</div>
                  <div>{order.orderId.shippingAddress.area}, {order.orderId.shippingAddress.district}</div>
                </div>
              )}
              {order.orderId && (
                <div className="mt-2 pt-2 border-top small text-muted d-flex justify-content-between align-items-center">
                  <span>Linked Order:</span>
                  <span className="badge bg-secondary font-monospace" style={{ fontSize: '11px' }}>{order.orderId.orderId || order.orderId._id}</span>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom py-3">
              <h6 className="m-0 fw-bold"><IoShirtOutline className="me-2" /> Product Info</h6>
            </Card.Header>
            <Card.Body>
              <p className="mb-1 text-capitalize"><strong>Type:</strong> {order.productType}</p>
              <p className="mb-1"><strong>Size:</strong> {order.size}</p>
              <p className="mb-1 d-flex align-items-center gap-2">
                <strong>Color:</strong> 
                <span style={{ display:'inline-block', width:16, height:16, background:order.color, borderRadius:'50%', border:'1px solid #ccc' }}></span>
                ({order.color})
              </p>
              <p className="mb-1"><strong>Quantity:</strong> {order.quantity}</p>
              <p className="mb-0"><strong>Total Price:</strong> ৳{order.price}</p>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom py-3">
              <h6 className="m-0 fw-bold"><IoBrushOutline className="me-2" /> Design Layers & Assets</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <p className="small text-muted mb-3">Individual print elements, fonts, colors, and design layers.</p>
              {renderLayerList(order.canvasJson?.front?.objects, 'Front')}
              <hr className="my-3" />
              {renderLayerList(order.canvasJson?.back?.objects, 'Back')}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - 3D Viewer */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom py-3">
              <h6 className="m-0 fw-bold">Interactive 3D Design Preview</h6>
            </Card.Header>
            <Card.Body className="p-0 position-relative" style={{ minHeight: '600px', background: '#f8f9fa' }}>
              {fCanvas && bCanvas ? (
                <Tshirt3DViewer
                  tshirtColor={order.color}
                  tshirtView="front"
                  frontFabricCanvas={fCanvas}
                  backFabricCanvas={bCanvas}
                  visible={true}
                  interactive={true}
                  garmentType={order.productType}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <Spinner animation="grow" variant="secondary" />
                </div>
              )}
              <div className="position-absolute bottom-0 start-50 translate-middle-x pb-4 pointer-events-none" style={{ zIndex: 10 }}>
                <span className="badge bg-dark bg-opacity-75 px-3 py-2 rounded-pill shadow">
                  Drag to rotate • Scroll to zoom
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={!!previewModalImg} onHide={() => setPreviewModalImg(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '15px', fontWeight: 'bold' }}>Design Layer Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center bg-light p-4">
          <img 
            src={previewModalImg} 
            alt="Full Preview" 
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
          />
        </Modal.Body>
        <Modal.Footer>
          {previewModalImg?.startsWith('data:') ? (
            <a 
              href={previewModalImg} 
              download="custom-design-layer.png" 
              className="btn btn-primary d-flex align-items-center gap-2 text-white"
              style={{ background: 'linear-gradient(135deg,#ff8525 0%,#e53e3e 100%)', border: 'none' }}
            >
              <IoDownload size={16} /> Download Layer
            </a>
          ) : (
            <a 
              href={previewModalImg} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary d-flex align-items-center gap-2"
            >
              <IoEyeOutline size={16} /> Open in New Tab
            </a>
          )}
          <Button variant="secondary" onClick={() => setPreviewModalImg(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
