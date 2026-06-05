'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Row, Col, Tab, Tabs } from 'react-bootstrap';
import {
  IoImagesOutline, IoAddOutline, IoPencilOutline, IoTrashOutline,
  IoEyeOutline, IoEyeOffOutline, IoArrowUpOutline, IoCloudUploadOutline,
  IoLibraryOutline, IoFolderOpenOutline
} from 'react-icons/io5';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBackendUrl } from '@/utils/api';

export default function AdminHeroSlidesPage() {
  const { showToast } = useUI();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [buttonText, setButtonText] = useState('Shop Now');
  const [isCustom, setIsCustom] = useState(false);
  const [order, setOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Media Manager States
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');
  const [activeMediaTab, setActiveMediaTab] = useState('library');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null); // 'add' or 'edit'

  const { data: mediaData, refetch: refetchMedia, isLoading: isLoadingMedia } = useQuery({
    queryKey: ['media'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/media`);
        if (res.data.success) {
          return res.data.media;
        }
        return [];
      } catch (err) {
        console.error('Error fetching media:', err);
        return [];
      }
    },
    enabled: showMediaModal
  });

  const mediaItems = mediaData || [];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingMedia(true);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/media/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        showToast('Image uploaded and saved to library!', 'success');
        setSelectedMediaUrl(res.data.media.url);
        refetchMedia();
        setActiveMediaTab('library');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error uploading file', 'error');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteMedia = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this image from server storage?')) {
      return;
    }
    try {
      const res = await axios.delete(`${getBackendUrl()}/api/media/${id}`);
      if (res.data.success) {
        showToast('Image deleted from library successfully', 'info');
        refetchMedia();
        if (selectedMediaUrl === id) {
          setSelectedMediaUrl('');
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting media asset', 'error');
    }
  };

  const openMediaLibraryForAdd = () => {
    setMediaTarget('add');
    setSelectedMediaUrl(image);
    setActiveMediaTab('library');
    setShowMediaModal(true);
  };

  const openMediaLibraryForEdit = () => {
    setMediaTarget('edit');
    setSelectedMediaUrl(image);
    setActiveMediaTab('library');
    setShowMediaModal(true);
  };

  const handleSelectMedia = () => {
    setImage(selectedMediaUrl);
    setShowMediaModal(false);
  };

  const { data: slidesData, isLoading, refetch } = useQuery({
    queryKey: ['adminSlides'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/hero-slides/admin`);
        if (res.data.success) {
          return res.data.slides;
        }
        throw new Error('Not successful');
      } catch (err) {
        console.warn('Backend server unseeded or offline, serving administrative mock slides');
        return [
          {
            _id: 'mock-s-1',
            badge: 'HOT RETAIL PROMO',
            title: "Design Your Own <br /> <span style='color: var(--accent-red)'>Premium Cotton</span> T-Shirt",
            subtitle: "Unleash your creativity. Drag and drop designs, add text, and adjust sizes on realistic 3D mockups.",
            image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop",
            link: "/design",
            buttonText: "Start Designing Now",
            isCustom: true,
            order: 0,
            isActive: true
          },
          {
            _id: 'mock-s-2',
            badge: 'EID COLLECTION 2026',
            title: "Premium Panjabis & <br /> <span class='text-danger'>Traditional Fashion</span>",
            subtitle: "Shop from the finest Banarasi, Georgette and Cotton Panjabi catalog with up to 30% discount.",
            image: "https://images.unsplash.com/photo-1608748010899-18f300247112?w=500&auto=format&fit=crop",
            link: "/shop?category=Panjabi",
            buttonText: "Explore Eid Collection",
            isCustom: false,
            order: 1,
            isActive: true
          }
        ];
      }
    }
  });

  const slides = slidesData || [];

  // Metrics
  const totalSlides = slides.length;
  const activeSlidesCount = slides.filter(s => s.isActive).length;
  const hiddenSlidesCount = totalSlides - activeSlidesCount;

  // Modal Open actions
  const handleOpenAdd = () => {
    setTitle('');
    setSubtitle('');
    setBadge('');
    setImage('');
    setLink('/shop');
    setButtonText('Shop Now');
    setIsCustom(false);
    setOrder('0');
    setIsActive(true);
    setShowAddModal(true);
  };

  const handleOpenEdit = (slide) => {
    setSelectedSlide(slide);
    setTitle(slide.title);
    setSubtitle(slide.subtitle || '');
    setBadge(slide.badge || '');
    setImage(slide.image);
    setLink(slide.link || '/shop');
    setButtonText(slide.buttonText || 'Shop Now');
    setIsCustom(slide.isCustom || false);
    setOrder(slide.order !== undefined ? String(slide.order) : '0');
    setIsActive(slide.isActive !== undefined ? slide.isActive : true);
    setShowEditModal(true);
  };

  // Submissions
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      showToast('Please choose a banner image from the Library or paste a URL', 'error');
      return;
    }

    // Auto-generate a label from the image path/timestamp if not provided
    const autoTitle = title || `Banner ${new Date().toLocaleDateString('en-BD')}`;

    setSaving(true);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/hero-slides`, {
        title: autoTitle,
        image,
        link,
        order: Number(order || 0),
        isActive
      });

      if (res.data.success) {
        showToast('Banner slide created successfully!', 'success');
        setShowAddModal(false);
        queryClient.invalidateQueries({ queryKey: ['heroSlides'] });
        queryClient.invalidateQueries({ queryKey: ['adminSlides'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      showToast('Please choose a banner image from the Library or paste a URL', 'error');
      return;
    }

    const autoTitle = title || `Banner ${new Date().toLocaleDateString('en-BD')}`;

    setSaving(true);
    try {
      const res = await axios.put(`${getBackendUrl()}/api/hero-slides/${selectedSlide._id}`, {
        title: autoTitle,
        image,
        link,
        order: Number(order || 0),
        isActive
      });

      if (res.data.success) {
        showToast('Hero slide updated successfully!', 'success');
        setShowEditModal(false);
        queryClient.invalidateQueries({ queryKey: ['heroSlides'] });
        queryClient.invalidateQueries({ queryKey: ['adminSlides'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating slide', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hero slide?')) {
      return;
    }

    try {
      const res = await axios.delete(`${getBackendUrl()}/api/hero-slides/${id}`);
      if (res.data.success) {
        showToast('Hero slide deleted successfully', 'info');
        queryClient.invalidateQueries({ queryKey: ['heroSlides'] });
        queryClient.invalidateQueries({ queryKey: ['adminSlides'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting slide', 'error');
    }
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
      
      {/* 1. ANALYTICAL SUMMARY STATISTICS */}
      <Row className="g-3">
        <Col md={4}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3">
            <Card.Body className="p-1 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block small mb-1">Total Slides</span>
                <h4 className="fw-extrabold mb-0" style={{ color: 'var(--primary-navy)' }}>
                  {totalSlides}
                </h4>
              </div>
              <div className="rounded bg-primary bg-opacity-10 text-primary p-3">
                <IoImagesOutline size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3">
            <Card.Body className="p-1 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block small mb-1">Active Slides</span>
                <h4 className="fw-extrabold text-success mb-0">
                  {activeSlidesCount}
                </h4>
              </div>
              <div className="rounded bg-success bg-opacity-10 text-success p-3">
                <IoEyeOutline size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3">
            <Card.Body className="p-1 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block small mb-1">Hidden Slides</span>
                <h4 className="fw-extrabold text-warning mb-0">
                  {hiddenSlidesCount}
                </h4>
              </div>
              <div className="rounded bg-warning bg-opacity-10 text-warning p-3">
                <IoEyeOffOutline size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 2. MAIN CRUD DATA TABLE */}
      <Card className="custom-card border-0 p-4 shadow-sm bg-white rounded-4">
        <Card.Body className="p-0">
          <div className="d-flex justify-content-between align-items-md-center flex-column flex-md-row gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
                <IoImagesOutline /> Hero Slideshow Manager
              </h5>
              <p className="text-muted small mb-0 d-flex align-items-center gap-1">
                Customize, reorder, and configure Eid campaigns or drag-and-drop designer slideshow entries.
              </p>
            </div>
            
            <Button
              variant="danger"
              onClick={handleOpenAdd}
              className="btn-premium-accent bg-red-gradient border-0 px-3 py-2 d-flex align-items-center gap-2 rounded-3 align-self-start"
            >
              <IoAddOutline size={20} /> Create New Slide
            </Button>
          </div>

          {isLoading ? (
            <div className="skeleton mb-3" style={{ height: '220px' }}></div>
          ) : slides.length === 0 ? (
            <div className="text-center py-5">
              <IoImagesOutline size={44} className="text-muted mb-2 opacity-50" />
              <span className="text-muted d-block small">No slideshow slides cataloged. Create one to get started!</span>
            </div>
          ) : (
            <Table responsive bordered hover className="align-middle text-center small mb-0" style={{ fontSize: '13.5px' }}>
              <thead className="table-dark">
                <tr>
                  <th>Preview</th>
                  <th>Action Redirect Path</th>
                  <th>Order Weight</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slides.map((s) => (
                  <tr key={s._id}>
                    <td className="py-2" style={{ width: '120px' }}>
                      <img
                        src={s.image && (s.image.startsWith('http') ? s.image : `${getBackendUrl()}${s.image}`)}
                        alt="Thumbnail"
                        className="rounded object-fit-cover shadow-sm border"
                        style={{ width: '80px', height: '50px' }}
                      />
                    </td>
                    <td className="font-monospace text-muted">{s.link}</td>
                    <td className="fw-extrabold text-danger">
                      <IoArrowUpOutline size={12} className="me-1 text-muted" />{s.order}
                    </td>
                    <td>
                      <Badge bg={s.isActive ? 'success' : 'secondary'} className="px-2 py-1 uppercase" style={{ fontSize: '10px' }}>
                        {s.isActive ? 'Active' : 'Hidden'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
                          className="rounded-2 d-flex align-items-center justify-content-center p-2"
                        >
                          <IoPencilOutline size={15} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteSlide(s._id)}
                          className="rounded-2 d-flex align-items-center justify-content-center p-2"
                        >
                          <IoTrashOutline size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* 3. ADD SLIDE MODAL */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Form onSubmit={handleAddSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Create New Hero Slide</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3 p-4">
            <Form.Group>
              <Form.Label className="small fw-semibold">Banner Image URL *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Choose an image from Library or paste direct link"
                  className="form-control-premium"
                  required
                />
                <Button 
                  variant="outline-danger" 
                  onClick={openMediaLibraryForAdd}
                  className="d-flex align-items-center gap-1"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <IoFolderOpenOutline size={16} /> Library
                </Button>
              </div>
            </Form.Group>

            <Row className="g-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Redirect Link (e.g. /shop?category=Panjabi)</Form.Label>
                  <Form.Control
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="form-control-premium"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Sort Order Weight</Form.Label>
                  <Form.Control
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="form-control-premium"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mt-2">
              <Form.Check
                type="switch"
                id="add-is-active-switch"
                label="Make Banner Active and Visible"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="fw-bold text-success"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} variant="danger" size="sm" className="bg-red-gradient border-0 px-4">
              {saving ? 'Creating slide...' : 'Create Slide'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 4. EDIT SLIDE MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
        <Form onSubmit={handleEditSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Modify Hero Slide details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3 p-4">
            <Form.Group>
              <Form.Label className="small fw-semibold">Banner Image URL *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="form-control-premium"
                  required
                />
                <Button 
                  variant="outline-danger" 
                  onClick={openMediaLibraryForEdit}
                  className="d-flex align-items-center gap-1"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <IoFolderOpenOutline size={16} /> Library
                </Button>
              </div>
            </Form.Group>

            <Row className="g-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Redirect Link</Form.Label>
                  <Form.Control
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="form-control-premium"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Sort Order Weight</Form.Label>
                  <Form.Control
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="form-control-premium"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mt-2">
              <Form.Check
                type="switch"
                id="edit-is-active-switch"
                label="Make Banner Active and Visible"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="fw-bold text-success"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} variant="danger" size="sm" className="bg-red-gradient border-0 px-4">
              {saving ? 'Saving changes...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 5. MEDIA MANAGER LIBRARY MODAL */}
      <Modal show={showMediaModal} onHide={() => setShowMediaModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
            <IoImagesOutline /> Media Asset Manager
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Tabs
            id="media-manager-tabs"
            activeKey={activeMediaTab}
            onSelect={(k) => setActiveMediaTab(k)}
            className="mb-4"
          >
            {/* Upload Tab */}
            <Tab eventKey="upload" title={<span className="d-flex align-items-center gap-1"><IoCloudUploadOutline /> Upload Image</span>}>
              <div className="border border-2 border-dashed rounded-4 p-5 text-center bg-light position-relative" style={{ transition: '0.2s' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <div className="py-4">
                  <IoCloudUploadOutline size={48} className="text-danger mb-3" />
                  <h6 className="fw-bold">Drag and drop files here to upload</h6>
                  <p className="text-muted small">or click to browse from files (Max 10MB)</p>
                  {uploadingMedia && (
                    <div className="mt-3">
                      <div className="spinner-border spinner-border-sm text-danger me-2" role="status"></div>
                      <span className="small text-danger fw-bold">Uploading file to server...</span>
                    </div>
                  )}
                </div>
              </div>
            </Tab>

            {/* Library Grid Tab */}
            <Tab eventKey="library" title={<span className="d-flex align-items-center gap-1"><IoLibraryOutline /> Media Library</span>}>
              {isLoadingMedia ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-3 text-muted small">Fetching media library...</p>
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="text-center py-5 bg-light rounded border">
                  <IoLibraryOutline size={40} className="text-muted mb-2 opacity-50" />
                  <p className="text-muted small mb-0">No images uploaded yet. Upload your first slide image!</p>
                </div>
              ) : (
                <Row className="g-3 overflow-y-auto" style={{ maxHeight: '350px' }}>
                  {mediaItems.map((item) => {
                    const isSelected = selectedMediaUrl === item.url;
                    return (
                      <Col key={item._id} xs={6} sm={4} md={3}>
                        <div
                          onClick={() => setSelectedMediaUrl(item.url)}
                          className={`position-relative rounded overflow-hidden border border-2 shadow-sm ${
                            isSelected ? 'border-danger' : 'border-light-subtle'
                          }`}
                          style={{ height: '110px', cursor: 'pointer', transition: '0.2s' }}
                        >
                          <img
                            src={getBackendUrl() + item.url}
                            alt={item.filename}
                            className="w-100 h-100 object-fit-cover"
                          />
                          {isSelected && (
                            <div className="position-absolute top-0 end-0 bg-danger text-white px-2 py-1 rounded-bottom-start shadow-sm" style={{ fontSize: '10px' }}>
                              Selected
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMedia(item._id, e)}
                            className="position-absolute bottom-0 start-0 border-0 bg-dark bg-opacity-70 text-white p-2 d-flex align-items-center justify-content-center"
                            style={{ borderTopRightRadius: '8px' }}
                            title="Delete image"
                          >
                            <IoTrashOutline size={13} />
                          </button>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </Tab>
          </Tabs>

          {/* Current URL Selection Display */}
          {selectedMediaUrl && (
            <div className="mt-3 p-3 bg-light rounded border">
              <span className="small text-muted d-block fw-semibold mb-1">Selected Image Reference:</span>
              <code className="text-danger small break-all d-block">{selectedMediaUrl}</code>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowMediaModal(false)}>Cancel</Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSelectMedia}
            disabled={!selectedMediaUrl}
            className="bg-red-gradient border-0 px-4"
          >
            Insert Image URL
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}
