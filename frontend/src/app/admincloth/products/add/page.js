'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from 'react';
import { Card, Form, Button, Row, Col, Badge, InputGroup, Modal, Tab, Tabs } from 'react-bootstrap';
import { 
  IoArrowBackOutline, IoSaveOutline, IoAdd, IoTrashOutline, 
  IoSearchOutline, IoCloudUploadOutline, IoLibraryOutline 
} from 'react-icons/io5';
import { useUI } from '../../../../context/UIContext';
import axios from 'axios';
import { getBackendUrl } from '@/utils/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// CKEditor 4 Dynamic CDN loader and React wrapper
function CKEditorWrapper({ id, value, onChange, placeholder }) {
  const [editorLoaded, setEditorLoaded] = useState(false);
  const editorRef = useRef(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (window.CKEDITOR) {
      setEditorLoaded(true);
      return;
    }
    
    // Prevent duplicate script loading
    let script = document.querySelector('script[src="https://cdn.ckeditor.com/4.22.1/full/ckeditor.js"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://cdn.ckeditor.com/4.22.1/full/ckeditor.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const interval = setInterval(() => {
      if (window.CKEDITOR) {
        setEditorLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let editorInstance = null;

    if (editorLoaded && window.CKEDITOR) {
      if (window.CKEDITOR.instances[id]) {
        window.CKEDITOR.instances[id].destroy(true);
      }

      editorInstance = window.CKEDITOR.replace(id, {
        placeholder: placeholder || '',
        height: 220,
        removePlugins: 'easyimage,cloudservices,exportpdf',
        resize_enabled: true
      });

      editorInstance.on('instanceReady', () => {
        editorInstance.setData(value || '');
      });

      editorInstance.on('change', () => {
        const data = editorInstance.getData();
        lastValueRef.current = data;
        onChange(data);
      });
    }

    return () => {
      if (window.CKEDITOR && window.CKEDITOR.instances[id]) {
        window.CKEDITOR.instances[id].destroy(true);
      }
    };
  }, [editorLoaded, id]);

  useEffect(() => {
    if (window.CKEDITOR && window.CKEDITOR.instances[id]) {
      if (value !== lastValueRef.current) {
        lastValueRef.current = value;
        window.CKEDITOR.instances[id].setData(value || '');
      }
    }
  }, [value, id]);

  return (
    <div className="ckeditor-wrapper-premium shadow-sm border rounded-3 overflow-hidden bg-white">
      <textarea 
        id={id} 
        ref={editorRef} 
        className="form-control border-0" 
        style={{ minHeight: '150px', display: 'block', width: '100%' }} 
        placeholder={placeholder}
        defaultValue={value || ''}
      />
    </div>
  );
}

export default function AddProductPage() {
  const { showToast } = useUI();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Core fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');

  // Categories list
  const [categories, setCategories] = useState([]);

  // Media Gallery (Array of URLs)
  const [images, setImages] = useState(['']);

  // Media Manager Modal States
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');
  const [activeMediaTab, setActiveMediaTab] = useState('library');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaTargetIndex, setMediaTargetIndex] = useState(0);

  // Fetch Media assets
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

  // Variants (Sizes & Colors)
  const [sizes, setSizes] = useState(['M', 'L', 'XL']);
  const [colors, setColors] = useState(['#0f172a', '#ffffff', '#dc2626']);
  const [newColor, setNewColor] = useState('#000000');

  // Color → Image mapping
  const [colorImages, setColorImages] = useState({});
  const [colorImageTarget, setColorImageTarget] = useState(null); // color hex being assigned

  // Specs
  const [specifications, setSpecifications] = useState(
    '<ul><li><strong>Fabric:</strong> 100% Cotton Premium GSM</li><li><strong>Fit:</strong> Regular Fit</li></ul>'
  );

  // Custom tabs content
  const [shippingReturns, setShippingReturns] = useState('');
  const [sizeGuide, setSizeGuide] = useState('');

  // Flags & Visibility
  const [status, setStatus] = useState('Active');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);

  // SEO details
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axios.get(`${getBackendUrl()}/api/categories`);
        if (res.data.success) {
          setCategories(res.data.categories);
          if (res.data.categories.length > 0) {
            setCategory(res.data.categories[0].slug);
          }
        }
      } catch (err) {
        console.warn('Backend categories offline, using mocks');
        setCategories([
          { _id: 'mock-1', name: 'Custom T-Shirts', slug: 'T-shirt' },
          { _id: 'mock-2', name: 'Polo Shirts', slug: 'Polo' },
          { _id: 'mock-3', name: 'Casual Shirts', slug: 'Shirt' },
          { _id: 'mock-4', name: 'Traditional Panjabi', slug: 'Panjabi' }
        ]);
        setCategory('T-shirt');
      }
    };
    fetchCats();
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setSlug(
      val.toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
    );
  };

  // Image actions
  const handleAddImageField = () => setImages([...images, '']);
  const handleImageChange = (index, val) => {
    const newImgs = [...images];
    newImgs[index] = val;
    setImages(newImgs);
  };
  const handleRemoveImageField = (index) => {
    const newImgs = images.filter((_, i) => i !== index);
    setImages(newImgs.length > 0 ? newImgs : ['']);
  };

  // Image file upload
  const handleFileUpload = async (index, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    try {
      showToast('Uploading image to media library...', 'info');
      const res = await axios.post(`${getBackendUrl()}/api/media/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success && res.data.media) {
        handleImageChange(index, res.data.media.url);
        showToast('Image uploaded successfully!', 'success');
      }
    } catch (err) {
      showToast('Upload failed: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // Media modal handlers
  const openMediaLibraryForIndex = (index) => {
    setMediaTargetIndex(index);
    setSelectedMediaUrl(images[index] || '');
    setActiveMediaTab('library');
    setShowMediaModal(true);
  };

  const handleSelectMedia = () => {
    if (colorImageTarget !== null) {
      // Assigning image to a color
      handleSetColorImage(colorImageTarget, selectedMediaUrl);
      setColorImageTarget(null);
    } else {
      handleImageChange(mediaTargetIndex, selectedMediaUrl);
    }
    setShowMediaModal(false);
  };

  const handleMediaModalFileUpload = async (e) => {
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

  const handleDeleteMedia = async (mediaId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this image from server storage?')) {
      return;
    }
    try {
      const res = await axios.delete(`${getBackendUrl()}/api/media/${mediaId}`);
      if (res.data.success) {
        showToast('Image deleted from library successfully', 'info');
        refetchMedia();
        if (selectedMediaUrl === mediaId) {
          setSelectedMediaUrl('');
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting media asset', 'error');
    }
  };

  // Variant size toggle
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const handleSizeToggle = (size) => {
    if (sizes.includes(size)) {
      setSizes(sizes.filter((s) => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  // Variant color actions
  const handleAddColor = () => {
    const cleanColor = newColor.trim().toLowerCase();
    if (cleanColor && !colors.includes(cleanColor)) {
      setColors([...colors, cleanColor]);
    }
  };
  const handleRemoveColor = (colorToRemove) => {
    setColors(colors.filter((c) => c !== colorToRemove));
    // also clean up colorImages map
    setColorImages((prev) => {
      const updated = { ...prev };
      delete updated[colorToRemove];
      return updated;
    });
  };

  // Color image assignment helpers
  const handleSetColorImage = (color, url) => {
    setColorImages((prev) => ({ ...prev, [color]: url }));
  };
  const openMediaLibraryForColor = (color) => {
    setColorImageTarget(color);
    setSelectedMediaUrl(colorImages[color] || '');
    setActiveMediaTab('library');
    setShowMediaModal(true);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !stock || !category) {
      showToast('Please check all required fields', 'error');
      return;
    }

    const filteredImages = images.filter((img) => img.trim() !== '');
    if (filteredImages.length === 0) {
      filteredImages.push('/images/placeholder-shirt.png');
    }

    // Clean description raw text for SEO preview and safety
    const strippedDescription = description.replace(/<[^>]*>/g, '').slice(0, 160);

    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sku,
      category,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      stock: Number(stock),
      variants: {
        sizes,
        colors
      },
      colorImages,
      specifications: specifications || '',
      status,
      featured,
      trending,
      description: description || 'Premium apparel crafted from high quality material.',
      images: filteredImages,
      seoTitle: seoTitle || name,
      seoDescription: seoDescription || strippedDescription,
      shippingReturns: shippingReturns || '',
      sizeGuide: sizeGuide || ''
    };

    try {
      const res = await axios.post(`${getBackendUrl()}/api/products`, payload);
      if (res.data.success) {
        showToast('Apparel product cataloged successfully!', 'success');
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['trending'] });
        router.push('/admincloth/products');
      }
    } catch (err) {
      showToast('Error listing product: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  return (
    <div className="pb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <Button variant="outline-dark" className="d-flex align-items-center gap-2 border-0 bg-white shadow-sm px-3 py-2" onClick={() => router.push('/admincloth/products')}>
          <IoArrowBackOutline size={18} /> Back to Products
        </Button>
        <h4 className="fw-bold mb-0 text-navy-gradient text-dark">Add New Premium Apparel Product</h4>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="gy-4">
          <Col lg={8} className="d-flex flex-column gap-4">
            
            {/* 1. Core Information Card */}
            <Card className="border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--primary-navy)' }}>1. Core Information</h5>
              <div className="d-flex flex-column gap-3">
                <Form.Group>
                  <Form.Label className="small fw-bold">Product Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    className="form-control-premium py-2 px-3"
                    placeholder="e.g. Summer Breathable Solid T-Shirt"
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Slug / Clean URL (Auto-Generated) *</Form.Label>
                      <Form.Control
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="form-control-premium font-monospace"
                        placeholder="e.g. summer-breathable-solid-t-shirt"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Category *</Form.Label>
                      <Form.Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="form-select-premium"
                        required
                      >
                        {categories.map((cat) => (
                          <option key={cat._id || cat.slug} value={cat.slug}>
                            {cat.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label className="small fw-bold">Product Description *</Form.Label>
                  <CKEditorWrapper
                    id="product-description-editor"
                    value={description}
                    onChange={setDescription}
                    placeholder="Provide a detailed, attractive description of fabric feel, design details, sizes fits, and durability..."
                  />
                </Form.Group>
              </div>
            </Card>

            {/* 2. Pricing & Inventory Card */}
            <Card className="border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--primary-navy)' }}>2. Pricing & Inventory</h5>
              <Row className="gy-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Regular Price (৳) *</Form.Label>
                    <Form.Control
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="form-control-premium"
                      placeholder="e.g. 1200"
                      min="0"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Discount / Sale Price (৳)</Form.Label>
                    <Form.Control
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      className="form-control-premium"
                      placeholder="e.g. 950 (Leave blank or 0 if none)"
                      min="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Stock Quantity *</Form.Label>
                    <Form.Control
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="form-control-premium"
                      placeholder="e.g. 100"
                      min="0"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">SKU (Stock Keeping Unit)</Form.Label>
                    <Form.Control
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="form-control-premium font-monospace"
                      placeholder="e.g. CW-TEE-BLK-S"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            {/* 3. Media Gallery Card */}
            <Card className="border-0 shadow-sm p-4 bg-white rounded-3">
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--primary-navy)' }}>3. Media Gallery</h5>
                <Button variant="outline-danger" size="sm" className="d-flex align-items-center gap-1 border-0 rounded-pill px-3" onClick={handleAddImageField}>
                  <IoAdd /> Add Image Field
                </Button>
              </div>
              <p className="text-muted small mb-3">Provide image URLs, choose from the **Library**, or **Upload** a local file.</p>

              <div className="d-flex flex-column gap-3">
                {images.map((img, index) => (
                  <div key={index} className="d-flex gap-3 align-items-center">
                    <span className="text-muted small fw-bold" style={{ minWidth: '60px' }}>
                      {index === 0 ? 'Primary:' : `Image ${index + 1}:`}
                    </span>
                    <InputGroup className="flex-grow-1">
                      <Form.Control
                        type="text"
                        value={img}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        className="form-control-premium"
                        placeholder="https://images.unsplash.com/... or /images/apparel.png"
                      />
                      <Form.Control
                        type="file"
                        id={`file-upload-${index}`}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={(e) => handleFileUpload(index, e.target.files[0])}
                      />
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => openMediaLibraryForIndex(index)}
                        title="Choose from Media Library"
                        className="d-flex align-items-center gap-1 px-3 text-muted border"
                        style={{ borderColor: '#CBD5E1', background: '#F8FAFC' }}
                      >
                        <IoLibraryOutline size={18} /> Library
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => document.getElementById(`file-upload-${index}`).click()}
                        title="Upload file from device"
                        className="d-flex align-items-center gap-1 px-3 border-start-0 text-muted border"
                        style={{ borderColor: '#CBD5E1', background: '#F8FAFC' }}
                      >
                        <IoCloudUploadOutline size={18} /> Upload
                      </Button>
                    </InputGroup>
                    {img && (
                      <div className="border rounded-3 p-1 bg-light">
                        <img 
                          src={img.startsWith('http') ? img : `${getBackendUrl()}${img}`} 
                          alt="preview" 
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    {images.length > 1 && (
                      <Button variant="outline-danger" size="sm" onClick={() => handleRemoveImageField(index)}>
                        <IoTrashOutline size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* 4. Product Technical Specifications Card */}
            <Card className="border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--primary-navy)' }}>4. Technical Specifications</h5>
              <p className="text-muted small mb-3">Add detailed clothing properties (e.g. GSM, fabric count, weave pattern, care guidelines) with custom tables, images, headings, lists, or headers.</p>
              <CKEditorWrapper
                id="product-specifications-editor"
                value={specifications}
                onChange={setSpecifications}
                placeholder="Specify fabric details, wash care rules, and country origins..."
              />
            </Card>

            {/* Custom Shipping & Returns Card */}
            <Card className="border-0 shadow-sm p-4 bg-white rounded-3 mt-4">
              <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--primary-navy)' }}>Custom Shipping & Returns</h5>
              <p className="text-muted small mb-3">Provide custom shipping rates, delivery timelines, or return rules for this specific product. Leave blank to display the default template.</p>
              <CKEditorWrapper
                id="product-shipping-editor"
                value={shippingReturns}
                onChange={setShippingReturns}
                placeholder="Add custom delivery and return guidelines..."
              />
            </Card>

            {/* Custom Size Guide Card */}
            <Card className="border-0 shadow-sm p-4 bg-white rounded-3 mt-4">
              <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--primary-navy)' }}>Custom Size Guide</h5>
              <p className="text-muted small mb-3">Insert custom measurement tables, fit guidelines, or styling dimensions for this specific item. Leave blank to display the default template.</p>
              <CKEditorWrapper
                id="product-size-guide-editor"
                value={sizeGuide}
                onChange={setSizeGuide}
                placeholder="Design a custom size chart or fit dimensions grid..."
              />
            </Card>
          </Col>

          {/* RIGHT SIDEBAR PANEL */}
          <Col lg={4} className="d-flex flex-column gap-4">
            
            {/* 5. Status & Visibility flags */}
            <Card className="border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--primary-navy)' }}>5. Publish Options</h5>
              
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Publishing Status</Form.Label>
                <Form.Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-select-premium"
                >
                  <option value="Active">Active (Storefront Visible)</option>
                  <option value="Draft">Draft (Admin Only)</option>
                  <option value="Out of Stock">Out of Stock</option>
                </Form.Select>
              </Form.Group>

              <div className="d-flex flex-column gap-3 mt-3">
                <Form.Check 
                  type="switch"
                  id="featured-switch"
                  label={<strong className="small">Featured Product (Homepage slider)</strong>}
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="custom-switch-red"
                />
                <Form.Check 
                  type="switch"
                  id="trending-switch"
                  label={<strong className="small">Trending Item (High popularity)</strong>}
                  checked={trending}
                  onChange={(e) => setTrending(e.target.checked)}
                  className="custom-switch-red"
                />
              </div>
            </Card>

            {/* 6. Variants & Attributes Config */}
            <Card className="border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--primary-navy)' }}>6. Variant Options</h5>

              {/* Sizes Selection */}
              <div className="mb-4">
                <Form.Label className="small fw-bold d-block mb-2">Sizes Configuration</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {availableSizes.map((sz) => {
                    const isSelected = sizes.includes(sz);
                    return (
                      <Button
                        key={sz}
                        variant={isSelected ? 'danger' : 'outline-dark'}
                        size="sm"
                        className={`rounded-pill px-3 ${isSelected ? 'bg-red-gradient border-0' : ''}`}
                        onClick={() => handleSizeToggle(sz)}
                      >
                        {sz}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Colors Hex Selection */}
              <div>
                <Form.Label className="small fw-bold d-block mb-2">Colors Configuration</Form.Label>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {colors.map((col) => (
                    <Badge 
                      key={col} 
                      bg="light" 
                      text="dark" 
                      className="d-flex align-items-center gap-1 border py-2 px-2"
                      style={{ fontSize: '12px' }}
                    >
                      <span 
                        className="rounded-circle d-inline-block border" 
                        style={{ width: '12px', height: '12px', backgroundColor: col }}
                      ></span>
                      <span className="font-monospace text-uppercase" style={{ fontSize: '10px' }}>{col}</span>
                      <IoTrashOutline 
                        className="text-danger ms-1" 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => handleRemoveColor(col)} 
                      />
                    </Badge>
                  ))}
                  {colors.length === 0 && (
                    <span className="text-muted small">No colors configured.</span>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <Form.Control
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="form-control-color"
                    style={{ width: '42px', height: '38px', padding: '3px' }}
                    title="Choose Hex color"
                  />
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="#hexcode"
                      className="form-control-premium"
                      style={{ fontSize: '13px' }}
                    />
                    <Button variant="danger" className="bg-red-gradient border-0" onClick={handleAddColor}>
                      Add
                    </Button>
                  </InputGroup>
                </div>
              </div>

              {/* Color → Image Mapping */}
              {colors.length > 0 && (
                <div className="mt-4 pt-3 border-top">
                  <Form.Label className="small fw-bold d-block mb-1">Color Variant Images</Form.Label>
                  <p className="text-muted" style={{ fontSize: '11px' }}>Select an image from the **Media Gallery** (Section 3) for each color. When a customer clicks the color on the store, this image will automatically be shown.</p>
                  <div className="d-flex flex-column gap-3">
                    {colors.map((col) => {
                      const validGalleryImages = images.filter((img) => img && img.trim() !== '');
                      const selectedImg = colorImages[col] || '';

                      return (
                        <div key={col} className="p-3 border rounded-3 bg-light shadow-sm">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span
                              className="rounded-circle border shadow-sm"
                              style={{ width: '24px', height: '24px', backgroundColor: col, display: 'inline-block' }}
                            />
                            <span className="font-monospace text-uppercase fw-bold" style={{ fontSize: '12px' }}>{col}</span>
                            {selectedImg && (
                              <Badge bg="success" className="ms-auto small px-2 py-1">Mapped</Badge>
                            )}
                          </div>

                          {validGalleryImages.length === 0 ? (
                            <div className="text-muted small py-2">
                              No images in Media Gallery. Add images in Section 3 first.
                            </div>
                          ) : (
                            <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
                              {validGalleryImages.map((imgUrl, imgIdx) => {
                                const isSelected = selectedImg === imgUrl;
                                return (
                                  <div
                                    key={imgIdx}
                                    onClick={() => handleSetColorImage(col, isSelected ? '' : imgUrl)}
                                    className="position-relative border rounded overflow-hidden cursor-pointer"
                                    style={{
                                      width: '56px',
                                      height: '56px',
                                      cursor: 'pointer',
                                      border: isSelected ? '3px solid #dc2626' : '1px solid #e2e8f0',
                                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                      transition: 'all 0.2s ease',
                                      boxShadow: isSelected ? '0 0 8px rgba(220, 38, 38, 0.4)' : 'none'
                                    }}
                                    title={imgUrl}
                                  >
                                    <img
                                      src={imgUrl.startsWith('http') ? imgUrl : `${getBackendUrl()}${imgUrl}`}
                                      alt={`Gallery ${imgIdx + 1}`}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {isSelected && (
                                      <div 
                                        className="position-absolute top-0 end-0 bg-danger text-white d-flex align-items-center justify-content-center"
                                        style={{ width: '16px', height: '16px', borderBottomLeftRadius: '4px', fontSize: '10px' }}
                                      >
                                        ✓
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {selectedImg && (
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm" 
                                  onClick={() => handleSetColorImage(col, '')}
                                  className="py-1 px-2 border-dashed small"
                                  style={{ fontSize: '11px', height: '32px' }}
                                >
                                  Clear Image
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            {/* 7. SEO Meta Details */}
            <Card className="border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--primary-navy)' }}>7. SEO Meta Optimization</h5>
              
              <div className="d-flex flex-column gap-3">
                <Form.Group>
                  <Form.Label className="small fw-bold">SEO Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Leave blank to use Product Name"
                    className="form-control-premium"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small fw-bold">SEO Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Leave blank to auto-extract from product description..."
                    className="form-control-premium"
                  />
                </Form.Group>

                {/* Google Search Live Preview */}
                <div className="bg-light p-3 rounded-3 border mt-2">
                  <div className="d-flex align-items-center gap-1 text-muted mb-1" style={{ fontSize: '11px' }}>
                    <IoSearchOutline size={12} />
                    <span>Google Search Engine Preview</span>
                  </div>
                  <div className="text-truncate fw-medium text-primary" style={{ fontSize: '16px', color: '#1a0dab', cursor: 'pointer' }}>
                    {seoTitle || name || 'Please enter product name...'}
                  </div>
                  <div className="text-truncate text-success" style={{ fontSize: '13px', color: '#006621', margin: '2px 0' }}>
                    https://customwearbd.com/product/{slug || 'url-slug'}
                  </div>
                  <div className="text-muted small" style={{ fontSize: '12px', color: '#545454', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {seoDescription || description.replace(/<[^>]*>/g, '') || 'Add description details to generate Google snippet text preview...'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Save Buttons Panel */}
            <div className="d-flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-grow-1 py-3 border-0 bg-secondary"
                onClick={() => router.push('/admincloth/products')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="danger" 
                className="flex-grow-1 bg-red-gradient border-0 py-3 d-flex align-items-center justify-content-center gap-2 fw-bold"
              >
                <IoSaveOutline size={20} /> Publish Product
              </Button>
            </div>

          </Col>
        </Row>
      </Form>

      {/* MEDIA MANAGER LIBRARY MODAL */}
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
                  onChange={handleMediaModalFileUpload}
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
                  <p className="text-muted small mb-0">No images uploaded yet. Upload your first product image!</p>
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

      <style>{`
        .form-control-premium, .form-select-premium {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
          font-size: 14.5px !important;
          transition: 0.2s all ease-in-out !important;
        }
        .form-control-premium:focus, .form-select-premium:focus {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 0.18rem rgba(220, 38, 38, 0.15) !important;
        }
        .bg-red-gradient {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
        }
        .custom-switch-red .form-check-input:checked {
          background-color: #dc2626 !important;
          border-color: #dc2626 !important;
        }
        .form-control-color {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
        }
      `}</style>
    </div>
  );
}
