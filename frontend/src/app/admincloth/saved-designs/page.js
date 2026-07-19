'use client';
import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Modal, Spinner } from 'react-bootstrap';
import { IoBrushOutline, IoTrashOutline, IoEyeOutline } from 'react-icons/io5';
import axios from 'axios';
import { getBackendUrl, getProductImageUrl } from '../../../utils/api';
import { useUI } from '../../../context/UIContext';
import Tshirt3DViewer from '../../../components/Tshirt3DViewer';

export default function SavedDesignsManagement() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [show3DModal, setShow3DModal] = useState(false);
  const [modalFrontCanvas, setModalFrontCanvas] = useState(null);
  const [modalBackCanvas, setModalBackCanvas] = useState(null);
  const { showToast } = useUI();

  const fetchDesigns = async () => {
    try {
      const res = await axios.get(`${getBackendUrl()}/api/design/admin`, { withCredentials: true });
      if (res.data.success) {
        setDesigns(res.data.designs);
      }
    } catch (err) {
      console.error('Error fetching admin designs:', err);
      showToast('Failed to load saved custom designs', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const handleDeleteDesign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved custom design?')) return;
    try {
      const res = await axios.delete(`${getBackendUrl()}/api/design/admin/${id}`, { withCredentials: true });
      if (res.data.success) {
        showToast('Saved custom design deleted', 'success');
        fetchDesigns();
      }
    } catch (err) {
      showToast('Failed to delete saved design', 'error');
    }
  };

  const handleOpen3DPreview = (design) => {
    setSelectedDesign(design);
    setShow3DModal(true);
    
    // dynamically load fabric to create static canvases
    const fabric = require('fabric').fabric;
    const fCanvas = new fabric.StaticCanvas(null, { width: 240, height: 440 });
    const bCanvas = new fabric.StaticCanvas(null, { width: 240, height: 440 });
    
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0"><IoBrushOutline className="me-2 text-danger" /> Saved Custom Designs</h4>
        <Button variant="outline-danger" size="sm" onClick={fetchDesigns} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Designs'}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
          <p className="text-muted mt-2 small">Loading saved designs...</p>
        </div>
      ) : designs.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <IoBrushOutline size={48} className="text-muted mb-3 opacity-50" />
            <h6>No Saved Designs Found</h6>
            <p className="text-muted small mb-0">There are currently no saved custom designs stored in the database.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {designs.map((design) => {
            const hasUser = !!design.userId;
            return (
              <Col key={design._id} md={4} sm={6}>
                <Card className="custom-card border shadow-sm h-100 d-flex flex-column">
                  <div 
                    className="position-relative overflow-hidden bg-light d-flex align-items-center justify-content-center border-bottom" 
                    style={{ height: '200px' }}
                  >
                    <img
                      src={getProductImageUrl(design.previewImage)}
                      alt="design preview"
                      className="w-100 h-100 object-fit-contain p-2"
                    />
                    <Button 
                      variant="danger" 
                      size="sm" 
                      className="position-absolute rounded-circle shadow p-0 d-flex align-items-center justify-content-center" 
                      style={{ top: '10px', right: '10px', width: '32px', height: '32px' }}
                      onClick={() => handleDeleteDesign(design._id)}
                      title="Delete Design"
                    >
                      <IoTrashOutline size={16} />
                    </Button>
                  </div>
                  
                  <Card.Body className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                    <div>
                      <span className="small text-muted d-block mb-1">
                        👤 {hasUser ? design.userId.name : 'Guest/Unknown'}
                      </span>
                      {hasUser && (
                        <small className="text-muted d-block mb-2 text-truncate" style={{ fontSize: '11.5px' }}>
                          Email: {design.userId.email}
                        </small>
                      )}
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <Badge bg="danger" className="text-white text-capitalize small">
                          {design.garmentType}
                        </Badge>
                        <span 
                          style={{ 
                            display: 'inline-block', 
                            width: 14, 
                            height: 14, 
                            backgroundColor: design.tshirtColor, 
                            borderRadius: '50%', 
                            border: '1px solid #ccc' 
                          }}
                          title={`Color: ${design.tshirtColor}`}
                        ></span>
                      </div>
                    </div>
                    
                    <div>
                      <small className="text-muted d-block mb-3" style={{ fontSize: '11px' }}>
                        Saved: {new Date(design.createdAt).toLocaleDateString('en-BD')}
                      </small>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className="w-100 d-flex align-items-center justify-content-center fw-semibold text-white shadow-sm border-0 bg-red-gradient" 
                        style={{ padding: '7px' }}
                        onClick={() => handleOpen3DPreview(design)} 
                        title="3D Preview" 
                      >
                        <IoEyeOutline size={16} className="me-1" /> View in 3D
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

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
          <div className="position-absolute bottom-0 start-50 translate-middle-x pb-3 text-center pointer-events-none" style={{ zIndex: 10 }}>
            <span className="badge bg-dark bg-opacity-75 px-3 py-2 rounded-pill fw-semibold" style={{ fontSize: '11px' }}>
              👉 Drag to rotate • 🔍 Scroll to zoom
            </span>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
