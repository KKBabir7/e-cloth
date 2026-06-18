'use client';


import React, { useState } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Row, Col, Tab, Tabs, Alert } from 'react-bootstrap';
import {
  IoLayersOutline, IoAddOutline, IoPencilOutline, IoTrashOutline,
  IoEyeOutline, IoEyeOffOutline, IoArrowUpOutline, IoCloudUploadOutline,
  IoLibraryOutline, IoFolderOpenOutline
} from 'react-icons/io5';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBackendUrl } from '@/utils/api';

export default function AdminCategoriesPage() {
  const { showToast } = useUI();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [image, setImage] = useState('');
  const [tagline, setTagline] = useState('');
  const [accentColor, setAccentColor] = useState('#ff8525');
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

  const { data: categoriesData, isLoading, error, refetch } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/categories/admin`);
      if (res.data.success) {
        return res.data.categories;
      }
      throw new Error(res.data.message || 'Could not fetch categories');
    }
  });

  const categories = categoriesData || [];

  // Metrics
  const totalCategories = categories.length;
  const activeCategoriesCount = categories.filter(c => c.isActive).length;
  const hiddenCategoriesCount = totalCategories - activeCategoriesCount;

  // Modal Open actions
  const handleOpenAdd = () => {
    setName('');
    setSlug('');
    setImage('');
    setTagline('');
    setAccentColor('#ff8525');
    setOrder('0');
    setIsActive(true);
    setShowAddModal(true);
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setImage(category.image);
    setTagline(category.tagline || '');
    setAccentColor(category.accentColor || '#ff8525');
    setOrder(category.order !== undefined ? String(category.order) : '0');
    setIsActive(category.isActive !== undefined ? category.isActive : true);
    setShowEditModal(true);
  };

  // Submissions
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !image) {
      showToast('Please provide category name and choose an image thumbnail', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/categories`, {
        name,
        slug: slug || undefined,
        image,
        tagline,
        accentColor,
        order: Number(order || 0),
        isActive
      });

      if (res.data.success) {
        showToast('Category created successfully!', 'success');
        setShowAddModal(false);
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!name || !image) {
      showToast('Please provide category name and choose an image thumbnail', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(`${getBackendUrl()}/api/categories/${selectedCategory._id}`, {
        name,
        slug,
        image,
        tagline,
        accentColor,
        order: Number(order || 0),
        isActive
      });

      if (res.data.success) {
        showToast('Category updated successfully!', 'success');
        setShowEditModal(false);
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Products in this category will remain, but the category shortcut will disappear from menus.')) {
      return;
    }

    try {
      const res = await axios.delete(`${getBackendUrl()}/api/categories/${id}`);
      if (res.data.success) {
        showToast('Category deleted successfully', 'info');
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting category', 'error');
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
                <span className="text-muted d-block small mb-1">Total Categories</span>
                <h4 className="fw-extrabold mb-0" style={{ color: 'var(--primary-navy)' }}>
                  {totalCategories}
                </h4>
              </div>
              <div className="rounded bg-primary bg-opacity-10 text-primary p-3">
                <IoLayersOutline size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3">
            <Card.Body className="p-1 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block small mb-1">Active Categories</span>
                <h4 className="fw-extrabold text-success mb-0">
                  {activeCategoriesCount}
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
                <span className="text-muted d-block small mb-1">Hidden Categories</span>
                <h4 className="fw-extrabold text-warning mb-0">
                  {hiddenCategoriesCount}
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
                <IoLayersOutline /> Category Manager
              </h5>
              <p className="text-muted small mb-0 d-flex align-items-center gap-1">
                Configure your eCommerce product categories dynamically. These will reflect in the main navigation menu and home page grid.
              </p>
            </div>
            
            <Button
              variant="danger"
              onClick={handleOpenAdd}
              className="btn-premium-accent bg-red-gradient border-0 px-3 py-2 d-flex align-items-center gap-2 rounded-3 align-self-start"
            >
              <IoAddOutline size={20} /> Create New Category
            </Button>
          </div>

          {isLoading ? (
            <div className="skeleton mb-3" style={{ height: '220px' }}></div>
          ) : error ? (
            <Alert variant="danger" className="text-center py-4 border-0 shadow-sm rounded-3">
              <h6 className="fw-bold mb-2">Database Connection Failed</h6>
              <p className="small text-muted mb-0">
                Could not retrieve categories from the server. Please ensure your backend server is running and database is connected.
              </p>
            </Alert>
          ) : categories.length === 0 ? (
            <div className="text-center py-5">
              <IoLayersOutline size={44} className="text-muted mb-2 opacity-50" />
              <span className="text-muted d-block small">No categories registered in the database yet.</span>
            </div>
          ) : (
            <Table responsive bordered hover className="align-middle text-center small mb-0" style={{ fontSize: '13.5px' }}>
              <thead className="table-dark">
                <tr>
                  <th>Preview</th>
                  <th>Category Name</th>
                  <th>Tagline</th>
                  <th>Slug (Filter Key)</th>
                  <th>Sort Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td className="py-2" style={{ width: '120px' }}>
                      <img
                        src={c.image && (c.image.startsWith('http') ? c.image : `${getBackendUrl()}${c.image}`)}
                        alt={c.name}
                        className="rounded object-fit-cover shadow-sm border"
                        style={{ width: '80px', height: '50px' }}
                      />
                    </td>
                    <td className="fw-bold">{c.name}</td>
                    <td className="text-muted small">{c.tagline || '—'}</td>
                    <td className="font-monospace text-muted">{c.slug}</td>
                    <td className="fw-extrabold text-danger">
                      <IoArrowUpOutline size={12} className="me-1 text-muted" />{c.order}
                    </td>
                    <td>
                      <Badge bg={c.isActive ? 'success' : 'secondary'} className="px-2 py-1 uppercase" style={{ fontSize: '10px' }}>
                        {c.isActive ? 'Active' : 'Hidden'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() => handleOpenEdit(c)}
                          className="rounded-2 d-flex align-items-center justify-content-center p-2"
                        >
                          <IoPencilOutline size={15} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteCategory(c._id)}
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

      {/* 3. ADD CATEGORY MODAL */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Form onSubmit={handleAddSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Create New Category</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3 p-4">
            <Form.Group>
              <Form.Label className="small fw-semibold">Category Name *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Polo Shirts"
                className="form-control-premium"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Slug Reference (leave blank to auto-generate)</Form.Label>
              <Form.Control
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. Polo (Matches product filter keys)"
                className="form-control-premium"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Thumbnail Image URL *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Choose from Library or paste link"
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

            <Form.Group>
              <Form.Label className="small fw-semibold">Tagline (subtitle on homepage card)</Form.Label>
              <Form.Control
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Comfort Wear"
                className="form-control-premium"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Accent Color (icon glow)</Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  title="Pick accent color"
                  style={{ width: '48px', height: '38px', padding: '2px', cursor: 'pointer' }}
                />
                <Form.Control
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#ff8525"
                  className="form-control-premium"
                />
              </div>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Sort Order Weight</Form.Label>
              <Form.Control
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="form-control-premium"
              />
            </Form.Group>

            <Form.Group className="mt-2">
              <Form.Check
                type="switch"
                id="add-is-active-switch"
                label="Make Category Active and Visible in Navigation Menu"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="fw-bold text-success"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} variant="danger" size="sm" className="bg-red-gradient border-0 px-4">
              {saving ? 'Creating category...' : 'Create Category'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 4. EDIT CATEGORY MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
        <Form onSubmit={handleEditSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Modify Category details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3 p-4">
            <Form.Group>
              <Form.Label className="small fw-semibold">Category Name *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-control-premium"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Slug Reference *</Form.Label>
              <Form.Control
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="form-control-premium"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Thumbnail Image URL *</Form.Label>
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

            <Form.Group>
              <Form.Label className="small fw-semibold">Tagline (subtitle on homepage card)</Form.Label>
              <Form.Control
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Smart Casual"
                className="form-control-premium"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Accent Color (icon glow)</Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  title="Pick accent color"
                  style={{ width: '48px', height: '38px', padding: '2px', cursor: 'pointer' }}
                />
                <Form.Control
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#ff8525"
                  className="form-control-premium"
                />
              </div>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Sort Order Weight</Form.Label>
              <Form.Control
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="form-control-premium"
              />
            </Form.Group>

            <Form.Group className="mt-2">
              <Form.Check
                type="switch"
                id="edit-is-active-switch"
                label="Make Category Active and Visible in Navigation Menu"
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
            <IoLibraryOutline /> Media Asset Manager
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
                  <p className="text-muted small mb-0">No images uploaded yet. Upload your first category thumbnail image!</p>
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
