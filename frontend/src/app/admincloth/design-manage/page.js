'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Row, Col, Alert, Tabs, Tab } from 'react-bootstrap';
import {
  IoFolderOpenOutline, IoAddOutline, IoPencilOutline, IoTrashOutline,
  IoEyeOutline, IoEyeOffOutline, IoSparklesOutline, IoColorPaletteOutline, IoImagesOutline
} from 'react-icons/io5';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBackendUrl } from '@/utils/api';
import * as BsIcons from 'react-icons/bs';
import * as IoIcons from 'react-icons/io5';

const renderCategoryIcon = (iconName) => {
  if (!iconName) return <BsIcons.BsTags size={16} className="text-muted" style={{ flexShrink: 0 }} />;
  if (iconName.startsWith('Io')) {
    const IconComponent = IoIcons[iconName];
    if (IconComponent) return <IconComponent size={16} className="text-muted" style={{ flexShrink: 0 }} />;
  } else {
    const IconComponent = BsIcons[iconName];
    if (IconComponent) return <IconComponent size={16} className="text-muted" style={{ flexShrink: 0 }} />;
  }
  return <BsIcons.BsTags size={16} className="text-muted" style={{ flexShrink: 0 }} />;
};

const allIconKeys = [
  ...Object.keys(BsIcons).filter(key => key.startsWith('Bs')),
  ...Object.keys(IoIcons).filter(key => key.startsWith('Io'))
];

const POPULAR_ICONS = [
  'IoShirtOutline', 'BsTags', 'BsFilterCircle', 'BsStars', 'BsBag', 'BsCart', 'BsHeart',
  'IoGiftOutline', 'BsGem', 'BsAward', 'BsScissors', 'BsPalette', 'BsFlower1', 'BsPatchCheck',
  'BsCollection', 'BsGrid', 'BsSuitClub', 'BsEmojiSmile', 'BsLightningCharge', 'BsFire',
  'BsCrown', 'BsSun', 'BsSnow', 'BsCompass', 'BsHourglassSplit'
];

const COLOR_NAMES_MAP = {
  '#ffffff': 'White',
  '#000000': 'Black',
  '#0f172a': 'Dark Navy',
  '#dc2626': 'Crimson Red',
  '#1e3a8a': 'Royal Blue',
  '#475569': 'Navy Gray',
  '#ff8525': 'Accent Orange',
  '#22c55e': 'Green',
  '#3b82f6': 'Blue',
  '#a855f7': 'Purple',
  '#eab308': 'Yellow',
  '#ec4899': 'Pink',
  '#f43f5e': 'Rose',
  '#14b8a6': 'Teal',
  '#f97316': 'Orange',
  '#6b7280': 'Gray',
  '#78350f': 'Brown',
  '#fef08a': 'Light Yellow',
  '#bbf7d0': 'Light Green',
  '#bfdbfe': 'Light Blue',
  '#fbcfe8': 'Light Pink'
};

const getColorName = (hex) => {
  const cleanHex = hex.toLowerCase().trim();
  if (COLOR_NAMES_MAP[cleanHex]) {
    return COLOR_NAMES_MAP[cleanHex];
  }
  const r1 = parseInt(cleanHex.substring(1, 3), 16);
  const g1 = parseInt(cleanHex.substring(3, 5), 16);
  const b1 = parseInt(cleanHex.substring(5, 7), 16);
  if (isNaN(r1) || isNaN(g1) || isNaN(b1)) return 'Custom Color';
  let closestName = 'Custom Color';
  let minDistance = Infinity;
  for (const [key, name] of Object.entries(COLOR_NAMES_MAP)) {
    const r2 = parseInt(key.substring(1, 3), 16);
    const g2 = parseInt(key.substring(3, 5), 16);
    const b2 = parseInt(key.substring(5, 7), 16);
    const dist = Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestName = name;
    }
  }
  return closestName;
};

function IconPicker({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const cleanSearch = search.replace(/[-_\s]/g, '').toLowerCase();
  const filteredKeys = search.trim() === ''
    ? POPULAR_ICONS
    : allIconKeys
        .filter(key => key.toLowerCase().replace(/[-_\s]/g, '').includes(cleanSearch))
        .slice(0, 200);

  let SelectedIcon = BsIcons.BsTags;
  if (value && value.startsWith('Io')) {
    SelectedIcon = IoIcons[value] || BsIcons.BsTags;
  } else if (value) {
    SelectedIcon = BsIcons[value] || BsIcons.BsTags;
  }

  return (
    <div className="position-relative w-100">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="form-control d-flex align-items-center justify-content-between bg-white"
        style={{ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #dee2e6' }}
      >
        <div className="d-flex align-items-center gap-2">
          <SelectedIcon size={18} style={{ color: '#ff8525' }} />
          <span className="fw-semibold" style={{ fontSize: '13.5px', color: '#1c1e23' }}>{value}</span>
        </div>
        <span className="text-muted" style={{ fontSize: '12px' }}>{isOpen ? 'Close ▴' : 'Choose Icon ▾'}</span>
      </div>

      {isOpen && (
        <div 
          className="position-absolute w-100 mt-2 p-3 shadow-lg bg-white rounded-3 border"
          style={{ zIndex: 1100, maxHeight: '340px', overflowY: 'auto' }}
        >
          <input 
            type="text"
            placeholder="Type to search (e.g. tshirt, bag, star)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control form-control-sm mb-3"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '6px', fontSize: '12.5px' }}
          />

          <div 
            className="d-grid gap-2" 
            style={{ gridTemplateColumns: 'repeat(5, 1fr)', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {filteredKeys.map((key) => {
              const IconComp = key.startsWith('Io') ? IoIcons[key] : BsIcons[key];
              if (!IconComp) return null;
              const isSelected = key === value;
              return (
                <button
                  key={key}
                  type="button"
                  title={key}
                  onClick={() => {
                    onChange(key);
                    setIsOpen(false);
                  }}
                  className={`btn p-2 d-flex align-items-center justify-content-center rounded-2 ${isSelected ? 'btn-danger bg-red-gradient text-white border-0' : 'btn-outline-light text-dark hover-bg-light'}`}
                  style={{ 
                    aspectRatio: '1',
                    border: isSelected ? 'none' : '1px solid #F1F5F9',
                    fontSize: '18px'
                  }}
                >
                  <IconComp size={18} />
                </button>
              );
            })}
          </div>
          {filteredKeys.length === 0 && (
            <div className="text-center text-muted small py-3">No matching icons found.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDesignManagePage() {
  const { showToast } = useUI();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('stickers');

  // ----------------------------------------------------
  // A. STICKERS MANAGEMENT STATE
  // ----------------------------------------------------
  const [showAddStickerModal, setShowAddStickerModal] = useState(false);
  const [showEditStickerModal, setShowEditStickerModal] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [stickerName, setStickerName] = useState('');
  const [stickerImage, setStickerImage] = useState('');
  const [stickerActive, setStickerActive] = useState(true);
  const [savingSticker, setSavingSticker] = useState(false);

  // ----------------------------------------------------
  // B. FABRIC COLORS MANAGEMENT STATE
  // ----------------------------------------------------
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [showEditColorModal, setShowEditColorModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#ffffff');
  const [colorSizes, setColorSizes] = useState(['S', 'M', 'L', 'XL', 'XXL']);
  const [colorActive, setColorActive] = useState(true);
  const [savingColor, setSavingColor] = useState(false);

  // ----------------------------------------------------
  // C. MEDIA MANAGER MODAL STATE
  // ----------------------------------------------------
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');
  const [activeMediaTab, setActiveMediaTab] = useState('library');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaTarget, setMediaTarget] = useState('sticker'); // 'sticker' or 'color'
  const [colorImage, setColorImage] = useState(''); // Color mockup image state
  const [colorPrice, setColorPrice] = useState(1100);
  const [colorDiscountPrice, setColorDiscountPrice] = useState(0);
  const [textFee, setTextFee] = useState(60);
  const [stickerFee, setStickerFee] = useState(40);
  const [imageFee, setImageFee] = useState(50);
  const [shapeFee, setShapeFee] = useState(30);
  const [savingSettings, setSavingSettings] = useState(false);

  // React Queries
  const { data: stickersData, isLoading: isLoadingStickers, error: errorStickers } = useQuery({
    queryKey: ['adminStickers'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/stickers/admin`);
      if (res.data.success) return res.data.stickers;
      throw new Error(res.data.message || 'Could not fetch stickers');
    }
  });

  const { data: colorsData, isLoading: isLoadingColors, error: errorColors } = useQuery({
    queryKey: ['adminColors'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/fabric-colors/admin`);
      if (res.data.success) return res.data.colors;
      throw new Error(res.data.message || 'Could not fetch fabric colors');
    }
  });

  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['adminDesignSettings'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/design-settings`);
      if (res.data.success) return res.data.settings;
      throw new Error(res.data.message || 'Could not fetch design settings');
    }
  });

  const { data: mediaData, refetch: refetchMedia } = useQuery({
    queryKey: ['media'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/media`);
      if (res.data.success) return res.data.media;
      return [];
    },
    enabled: showMediaModal
  });

  const stickers = stickersData || [];
  const colors = colorsData || [];
  const mediaItems = mediaData || [];

  // Media Handling
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingMedia(true);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/media/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
    if (!window.confirm('Delete image permanently from server storage?')) return;
    try {
      const res = await axios.delete(`${getBackendUrl()}/api/media/${id}`);
      if (res.data.success) {
        showToast('Image deleted from library successfully', 'info');
        refetchMedia();
        if (selectedMediaUrl === id) setSelectedMediaUrl('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting media asset', 'error');
    }
  };

  const handleSelectMedia = () => {
    if (mediaTarget === 'sticker') {
      setStickerImage(selectedMediaUrl);
    } else {
      setColorImage(selectedMediaUrl);
    }
    setShowMediaModal(false);
  };

  // Sticker Handlers
  const handleOpenAddSticker = () => {
    setStickerName('');
    setStickerImage('');
    setStickerActive(true);
    setShowAddStickerModal(true);
  };

  const handleOpenEditSticker = (s) => {
    setSelectedSticker(s);
    setStickerName(s.name);
    setStickerImage(s.image);
    setStickerActive(s.isActive !== undefined ? s.isActive : true);
    setShowEditStickerModal(true);
  };

  const handleAddStickerSubmit = async (e) => {
    e.preventDefault();
    if (!stickerName || !stickerImage) {
      showToast('Provide sticker name and choose an image URL', 'error');
      return;
    }
    setSavingSticker(true);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/stickers`, {
        name: stickerName,
        image: stickerImage,
        isActive: stickerActive
      });
      if (res.data.success) {
        showToast('Sticker created successfully!', 'success');
        setShowAddStickerModal(false);
        queryClient.invalidateQueries({ queryKey: ['stickers'] });
        queryClient.invalidateQueries({ queryKey: ['adminStickers'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating sticker', 'error');
    } finally {
      setSavingSticker(false);
    }
  };

  const handleEditStickerSubmit = async (e) => {
    e.preventDefault();
    setSavingSticker(true);
    try {
      const res = await axios.put(`${getBackendUrl()}/api/stickers/${selectedSticker._id}`, {
        name: stickerName,
        image: stickerImage,
        isActive: stickerActive
      });
      if (res.data.success) {
        showToast('Sticker updated successfully!', 'success');
        setShowEditStickerModal(false);
        queryClient.invalidateQueries({ queryKey: ['stickers'] });
        queryClient.invalidateQueries({ queryKey: ['adminStickers'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating sticker', 'error');
    } finally {
      setSavingSticker(false);
    }
  };

  const handleDeleteSticker = async (id) => {
    if (!window.confirm('Delete this sticker from catalog?')) return;
    try {
      const res = await axios.delete(`${getBackendUrl()}/api/stickers/${id}`);
      if (res.data.success) {
        showToast('Sticker deleted successfully', 'info');
        queryClient.invalidateQueries({ queryKey: ['stickers'] });
        queryClient.invalidateQueries({ queryKey: ['adminStickers'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting sticker', 'error');
    }
  };

  // Color Handlers
  const handleOpenAddColor = () => {
    setColorName('');
    setColorHex('#ffffff');
    setColorImage('');
    setColorPrice(1100);
    setColorDiscountPrice(0);
    setColorSizes(['S', 'M', 'L', 'XL', 'XXL']);
    setColorActive(true);
    setShowAddColorModal(true);
  };

  const handleOpenEditColor = (c) => {
    setSelectedColor(c);
    setColorName(c.name);
    setColorHex(c.hex);
    setColorImage(c.image || '');
    setColorPrice(c.price !== undefined ? c.price : 1100);
    setColorDiscountPrice(c.discountPrice !== undefined ? c.discountPrice : 0);
    setColorSizes(c.sizes || ['S', 'M', 'L', 'XL', 'XXL']);
    setColorActive(c.isActive !== undefined ? c.isActive : true);
    setShowEditColorModal(true);
  };

  const handleSizeCheckboxChange = (size, isChecked) => {
    if (isChecked) {
      setColorSizes([...colorSizes, size]);
    } else {
      setColorSizes(colorSizes.filter(s => s !== size));
    }
  };

  const handleAddColorSubmit = async (e) => {
    e.preventDefault();
    if (!colorName || !colorHex) {
      showToast('Provide color name and choose hex code', 'error');
      return;
    }
    setSavingColor(true);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/fabric-colors`, {
        name: colorName,
        hex: colorHex,
        image: colorImage,
        price: colorPrice,
        discountPrice: colorDiscountPrice,
        sizes: colorSizes,
        isActive: colorActive
      });
      if (res.data.success) {
        showToast('Fabric color created successfully!', 'success');
        setShowAddColorModal(false);
        queryClient.invalidateQueries({ queryKey: ['adminColors'] });
        queryClient.invalidateQueries({ queryKey: ['fabricColors'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating fabric color', 'error');
    } finally {
      setSavingColor(false);
    }
  };

  const handleEditColorSubmit = async (e) => {
    e.preventDefault();
    setSavingColor(true);
    try {
      const res = await axios.put(`${getBackendUrl()}/api/fabric-colors/${selectedColor._id}`, {
        name: colorName,
        hex: colorHex,
        image: colorImage,
        price: colorPrice,
        discountPrice: colorDiscountPrice,
        sizes: colorSizes,
        isActive: colorActive
      });
      if (res.data.success) {
        showToast('Fabric color updated successfully!', 'success');
        setShowEditColorModal(false);
        queryClient.invalidateQueries({ queryKey: ['adminColors'] });
        queryClient.invalidateQueries({ queryKey: ['fabricColors'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating fabric color', 'error');
    } finally {
      setSavingColor(false);
    }
  };

  const handleDeleteColor = async (id) => {
    if (!window.confirm('Delete this fabric color? This color shortcut will disappear from customizer.')) return;
    try {
      const res = await axios.delete(`${getBackendUrl()}/api/fabric-colors/${id}`);
      if (res.data.success) {
        showToast('Fabric color deleted successfully', 'info');
        queryClient.invalidateQueries({ queryKey: ['adminColors'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting fabric color', 'error');
    }
  };

  useEffect(() => {
    if (settingsData) {
      setTextFee(settingsData.textPrice !== undefined ? settingsData.textPrice : 60);
      setStickerFee(settingsData.stickerPrice !== undefined ? settingsData.stickerPrice : 40);
      setImageFee(settingsData.imagePrice !== undefined ? settingsData.imagePrice : 50);
      setShapeFee(settingsData.shapePrice !== undefined ? settingsData.shapePrice : 30);
    }
  }, [settingsData]);

  const handleUpdateSettingsSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await axios.put(`${getBackendUrl()}/api/design-settings`, {
        textPrice: textFee,
        stickerPrice: stickerFee,
        imagePrice: imageFee,
        shapePrice: shapeFee
      });
      if (res.data.success) {
        showToast('Design price settings updated successfully!', 'success');
        refetchSettings();
        queryClient.invalidateQueries({ queryKey: ['designSettings'] });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating design price settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
      
      <div>
        <h4 className="fw-extrabold mb-1" style={{ color: 'var(--primary-navy)' }}>Design Studio Configuration</h4>
        <p className="text-muted small mb-0">Configure colors, sizing constraints, and stickers available on the public customizer.</p>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-0 mb-2 custom-tabs">
        <Tab eventKey="stickers" title="🎨 Stickers Catalog">
          <div className="pt-3">
            {/* Analytical Statistics */}
            <Row className="g-3 mb-4">
              <Col md={4}>
                <Card className="custom-card border-0 shadow-sm bg-white p-3">
                  <Card.Body className="p-1 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted d-block small mb-1">Total Stickers</span>
                      <h4 className="fw-extrabold mb-0">{stickers.length}</h4>
                    </div>
                    <div className="rounded bg-primary bg-opacity-10 text-primary p-3">
                      <IoSparklesOutline size={22} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="custom-card border-0 shadow-sm bg-white p-3">
                  <Card.Body className="p-1 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted d-block small mb-1">Active Stickers</span>
                      <h4 className="fw-extrabold text-success mb-0">{stickers.filter(s => s.isActive).length}</h4>
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
                      <span className="text-muted d-block small mb-1">Hidden Stickers</span>
                      <h4 className="fw-extrabold text-warning mb-0">{stickers.filter(s => !s.isActive).length}</h4>
                    </div>
                    <div className="rounded bg-warning bg-opacity-10 text-warning p-3">
                      <IoEyeOffOutline size={22} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* main table */}
            <Card className="custom-card border-0 p-4 shadow-sm bg-white rounded-4">
              <Card.Body className="p-0">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold mb-0">Customizer Sticker Database</h6>
                  <Button variant="danger" onClick={handleOpenAddSticker} className="btn-premium-accent bg-red-gradient border-0 px-3 py-2 d-flex align-items-center gap-2 rounded-3">
                    <IoAddOutline size={20} /> Add Sticker
                  </Button>
                </div>

                {isLoadingStickers ? (
                  <div className="skeleton mb-3" style={{ height: '180px' }}></div>
                ) : errorStickers ? (
                  <Alert variant="danger">Connection error fetching stickers.</Alert>
                ) : stickers.length === 0 ? (
                  <div className="text-center py-5 text-muted">No stickers uploaded yet.</div>
                ) : (
                  <Table responsive bordered hover className="align-middle text-center small mb-0" style={{ fontSize: '13px' }}>
                    <thead className="table-dark">
                      <tr>
                        <th>Preview</th>
                        <th>Sticker Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stickers.map((s) => (
                        <tr key={s._id}>
                          <td>
                            <img src={s.image && (s.image.startsWith('http') ? s.image : `${getBackendUrl()}${s.image}`)} alt={s.name} className="rounded object-fit-contain p-1 border bg-light" style={{ width: '45px', height: '45px' }} />
                          </td>
                          <td className="fw-bold">{s.name}</td>
                          <td>
                            <Badge bg={s.isActive ? 'success' : 'secondary'}>{s.isActive ? 'Active' : 'Hidden'}</Badge>
                          </td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <Button variant="outline-dark" size="sm" onClick={() => handleOpenEditSticker(s)} className="p-2 rounded-2"><IoPencilOutline size={14} /></Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteSticker(s._id)} className="p-2 rounded-2"><IoTrashOutline size={14} /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </div>
        </Tab>

        <Tab eventKey="fabric-colors" title="👕 Fabric Colors, Sizes, Price">
          <div className="pt-3">
            {/* Analytical Statistics */}
            <Row className="g-3 mb-4">
              <Col md={4}>
                <Card className="custom-card border-0 shadow-sm bg-white p-3">
                  <Card.Body className="p-1 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted d-block small mb-1">Total Colors</span>
                      <h4 className="fw-extrabold mb-0">{colors.length}</h4>
                    </div>
                    <div className="rounded bg-primary bg-opacity-10 text-primary p-3">
                      <IoColorPaletteOutline size={22} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="custom-card border-0 shadow-sm bg-white p-3">
                  <Card.Body className="p-1 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted d-block small mb-1">Active Colors</span>
                      <h4 className="fw-extrabold text-success mb-0">{colors.filter(c => c.isActive).length}</h4>
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
                      <span className="text-muted d-block small mb-1">Hidden Colors</span>
                      <h4 className="fw-extrabold text-warning mb-0">{colors.filter(c => !c.isActive).length}</h4>
                    </div>
                    <div className="rounded bg-warning bg-opacity-10 text-warning p-3">
                      <IoEyeOffOutline size={22} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* main table */}
            <Card className="custom-card border-0 p-4 shadow-sm bg-white rounded-4">
              <Card.Body className="p-0">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold mb-0">Base Fabric Colors & Sizing Configurations</h6>
                  <Button variant="danger" onClick={handleOpenAddColor} className="btn-premium-accent bg-red-gradient border-0 px-3 py-2 d-flex align-items-center gap-2 rounded-3">
                    <IoAddOutline size={20} /> Add Fabric Color
                  </Button>
                </div>

                {isLoadingColors ? (
                  <div className="skeleton mb-3" style={{ height: '180px' }}></div>
                ) : errorColors ? (
                  <Alert variant="danger">Connection error fetching fabric colors.</Alert>
                ) : colors.length === 0 ? (
                  <div className="text-center py-5 text-muted">No customizer fabric colors defined.</div>
                ) : (
                  <Table responsive bordered hover className="align-middle text-center small mb-0" style={{ fontSize: '13px' }}>
                    <thead className="table-dark">
                      <tr>
                        <th>Color Hue</th>
                        <th>Color Name</th>
                        <th>Hex Value</th>
                        <th>Base Price</th>
                        <th>Promo Price</th>
                        <th>Available Sizes (Color-Linked Sizing)</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colors.map((c) => (
                        <tr key={c._id}>
                          <td>
                            {c.image ? (
                              <img 
                                src={c.image.startsWith('http') ? c.image : `${getBackendUrl()}${c.image}`} 
                                alt={c.name} 
                                className="rounded object-fit-contain border p-1 bg-light mx-auto" 
                                style={{ width: '45px', height: '45px' }} 
                              />
                            ) : (
                              <div className="rounded-circle border mx-auto shadow-sm" style={{ backgroundColor: c.hex, width: '32px', height: '32px' }} />
                            )}
                          </td>
                          <td className="fw-bold">{c.name}</td>
                          <td className="font-monospace text-muted">{c.hex}</td>
                          <td className="fw-bold text-dark">৳{c.price || 1100}</td>
                          <td className="fw-bold text-danger">{c.discountPrice > 0 ? `৳${c.discountPrice}` : <span className="text-muted small">-</span>}</td>
                          <td>
                            <div className="d-flex flex-wrap justify-content-center gap-1">
                              {c.sizes && c.sizes.length > 0 ? (
                                c.sizes.map(s => (
                                  <Badge key={s} bg="danger" className="bg-red-gradient px-2 py-1" style={{ fontSize: '10px' }}>{s}</Badge>
                                ))
                              ) : (
                                <span className="text-muted small">No sizes (out of stock)</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge bg={c.isActive ? 'success' : 'secondary'}>{c.isActive ? 'Active' : 'Hidden'}</Badge>
                          </td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <Button variant="outline-dark" size="sm" onClick={() => handleOpenEditColor(c)} className="p-2 rounded-2"><IoPencilOutline size={14} /></Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteColor(c._id)} className="p-2 rounded-2"><IoTrashOutline size={14} /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </div>
        </Tab>

        <Tab eventKey="design-price" title="🏷️ Design Price">
          <div className="pt-3">
            <Card className="custom-card border-0 p-4 shadow-sm bg-white rounded-4" style={{ maxWidth: '600px' }}>
              <Card.Body className="p-0">
                <h6 className="fw-bold mb-3" style={{ color: 'var(--primary-navy)' }}>Customizer Element Pricing Rules</h6>
                <p className="text-muted small mb-4">Set additional fees billed to the user when adding elements to their custom apparel design. The price will be calculated and updated dynamically in real-time on the storefront customizer.</p>
                
                <Form onSubmit={handleUpdateSettingsSubmit} className="d-flex flex-column gap-3">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Text Element Price (BDT per line of text) *</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={textFee} 
                      onChange={(e) => setTextFee(e.target.value)} 
                      min="0" 
                      placeholder="60" 
                      className="form-control-premium" 
                      required 
                    />
                    <Form.Text className="text-muted small">Every separate textbox or line break inside a textbox adds this fee (e.g. 1 line = 60tk, 2 lines = 120tk).</Form.Text>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="small fw-semibold">Sticker / Clipart Price (BDT per item) *</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={stickerFee} 
                      onChange={(e) => setStickerFee(e.target.value)} 
                      min="0" 
                      placeholder="40" 
                      className="form-control-premium" 
                      required 
                    />
                    <Form.Text className="text-muted small">Fee charged per sticker/clipart added onto the layout canvas.</Form.Text>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="small fw-semibold">Uploaded Image Price (BDT per image) *</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={imageFee} 
                      onChange={(e) => setImageFee(e.target.value)} 
                      min="0" 
                      placeholder="50" 
                      className="form-control-premium" 
                      required 
                    />
                    <Form.Text className="text-muted small">Fee charged per custom image file the user uploads onto their design.</Form.Text>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="small fw-semibold">Shape Element Price (BDT per shape) *</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={shapeFee} 
                      onChange={(e) => setShapeFee(e.target.value)} 
                      min="0" 
                      placeholder="30" 
                      className="form-control-premium" 
                      required 
                    />
                    <Form.Text className="text-muted small">Fee charged per shape (circle, rectangle, star, etc.) added to the canvas.</Form.Text>
                  </Form.Group>

                  <Button 
                    type="submit" 
                    disabled={savingSettings} 
                    variant="danger" 
                    className="bg-red-gradient border-0 px-4 mt-2 align-self-start btn-premium-accent"
                  >
                    {savingSettings ? 'Saving Settings...' : 'Save Pricing Rules'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </div>
        </Tab>
      </Tabs>

      {/* ----------------------------------------------------
          3. ADD STICKER MODAL
      ---------------------------------------------------- */}
      <Modal show={showAddStickerModal} onHide={() => setShowAddStickerModal(false)} centered size="lg">
        <Form onSubmit={handleAddStickerSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Add New Sticker</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3 p-4">
            <Form.Group>
              <Form.Label className="small fw-semibold">Sticker Name *</Form.Label>
              <Form.Control type="text" value={stickerName} onChange={(e) => setStickerName(e.target.value)} placeholder="e.g. Fire Emoji" className="form-control-premium" required />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-semibold">Sticker Image *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control type="text" value={stickerImage} onChange={(e) => setStickerImage(e.target.value)} placeholder="Choose from Library or paste link" className="form-control-premium" required />
                <Button variant="outline-danger" onClick={() => { setSelectedMediaUrl(stickerImage); setMediaTarget('sticker'); setShowMediaModal(true); }} className="d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}><IoFolderOpenOutline size={16} /> Library</Button>
              </div>
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Check type="switch" id="sticker-active-switch" label="Visible in Customizer stickers choices list" checked={stickerActive} onChange={(e) => setStickerActive(e.target.checked)} className="fw-bold text-success" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowAddStickerModal(false)}>Cancel</Button>
            <Button type="submit" disabled={savingSticker} variant="danger" size="sm" className="bg-red-gradient border-0 px-4">{savingSticker ? 'Creating...' : 'Create Sticker'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ----------------------------------------------------
          4. EDIT STICKER MODAL
      ---------------------------------------------------- */}
      <Modal show={showEditStickerModal} onHide={() => setShowEditStickerModal(false)} centered size="lg">
        <Form onSubmit={handleEditStickerSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Modify Sticker details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3 p-4">
            <Form.Group>
              <Form.Label className="small fw-semibold">Sticker Name *</Form.Label>
              <Form.Control type="text" value={stickerName} onChange={(e) => setStickerName(e.target.value)} className="form-control-premium" required />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-semibold">Sticker Image *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control type="text" value={stickerImage} onChange={(e) => setStickerImage(e.target.value)} className="form-control-premium" required />
                <Button variant="outline-danger" onClick={() => { setSelectedMediaUrl(stickerImage); setMediaTarget('sticker'); setShowMediaModal(true); }} className="d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}><IoFolderOpenOutline size={16} /> Library</Button>
              </div>
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Check type="switch" id="edit-sticker-active-switch" label="Visible in Customizer stickers choices list" checked={stickerActive} onChange={(e) => setStickerActive(e.target.checked)} className="fw-bold text-success" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowEditStickerModal(false)}>Cancel</Button>
            <Button type="submit" disabled={savingSticker} variant="danger" size="sm" className="bg-red-gradient border-0 px-4">{savingSticker ? 'Saving...' : 'Save Changes'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ----------------------------------------------------
          5. ADD FABRIC COLOR MODAL
      ---------------------------------------------------- */}
      <Modal show={showAddColorModal} onHide={() => setShowAddColorModal(false)} centered size="lg">
        <Form onSubmit={handleAddColorSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Create New Fabric Color</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3 p-4">
            <Form.Group>
              <Form.Label className="small fw-semibold">Fabric Color Name *</Form.Label>
              <Form.Control type="text" value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="e.g. Crimson Red" className="form-control-premium" required />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Hex Code / Color Picker *</Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control type="color" value={colorHex} onChange={(e) => {
                  const val = e.target.value;
                  setColorHex(val);
                  setColorName(getColorName(val));
                }} style={{ width: '48px', height: '38px', padding: '2px', cursor: 'pointer' }} />
                <Form.Control type="text" value={colorHex} onChange={(e) => {
                  const val = e.target.value;
                  setColorHex(val);
                  if (val.length === 7 && val.startsWith('#')) {
                    setColorName(getColorName(val));
                  }
                }} placeholder="#dc2626" className="form-control-premium" required />
              </div>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">T-Shirt Mockup Image (Optional - replaces color circle on storefront) *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control type="text" value={colorImage} onChange={(e) => setColorImage(e.target.value)} placeholder="Choose colored T-Shirt thumbnail or paste link" className="form-control-premium" />
                <Button variant="outline-danger" onClick={() => { setSelectedMediaUrl(colorImage); setMediaTarget('color'); setShowMediaModal(true); }} className="d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}><IoFolderOpenOutline size={16} /> Library</Button>
              </div>
            </Form.Group>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Base Price (BDT) *</Form.Label>
                  <Form.Control type="number" value={colorPrice} onChange={(e) => setColorPrice(e.target.value)} min="0" placeholder="1100" className="form-control-premium" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Promo Price (BDT - Optional)</Form.Label>
                  <Form.Control type="number" value={colorDiscountPrice} onChange={(e) => setColorDiscountPrice(e.target.value)} min="0" placeholder="0" className="form-control-premium" />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="small fw-semibold d-block mb-2">Available Sizing (Sizing options linked to this color)</Form.Label>
              <div className="d-flex gap-4 p-3 bg-light rounded-3">
                {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                  <Form.Check 
                    key={size}
                    type="checkbox"
                    id={`add-size-${size}`}
                    label={size}
                    checked={colorSizes.includes(size)}
                    onChange={(e) => handleSizeCheckboxChange(size, e.target.checked)}
                    className="fw-bold text-dark"
                  />
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mt-2">
              <Form.Check type="switch" id="color-active-switch" label="Visible in Customizer colors list" checked={colorActive} onChange={(e) => setColorActive(e.target.checked)} className="fw-bold text-success" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowAddColorModal(false)}>Cancel</Button>
            <Button type="submit" disabled={savingColor} variant="danger" size="sm" className="bg-red-gradient border-0 px-4">{savingColor ? 'Creating...' : 'Create Fabric Color'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ----------------------------------------------------
          6. EDIT FABRIC COLOR MODAL
      ---------------------------------------------------- */}
      <Modal show={showEditColorModal} onHide={() => setShowEditColorModal(false)} centered size="lg">
        <Form onSubmit={handleEditColorSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Modify Fabric Color details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3 p-4">
            <Form.Group>
              <Form.Label className="small fw-semibold">Fabric Color Name *</Form.Label>
              <Form.Control type="text" value={colorName} onChange={(e) => setColorName(e.target.value)} className="form-control-premium" required />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Hex Code / Color Picker *</Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control type="color" value={colorHex} onChange={(e) => {
                  const val = e.target.value;
                  setColorHex(val);
                  setColorName(getColorName(val));
                }} style={{ width: '48px', height: '38px', padding: '2px', cursor: 'pointer' }} />
                <Form.Control type="text" value={colorHex} onChange={(e) => {
                  const val = e.target.value;
                  setColorHex(val);
                  if (val.length === 7 && val.startsWith('#')) {
                    setColorName(getColorName(val));
                  }
                }} className="form-control-premium" required />
              </div>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">T-Shirt Mockup Image (Optional - replaces color circle on storefront) *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control type="text" value={colorImage} onChange={(e) => setColorImage(e.target.value)} placeholder="Choose colored T-Shirt thumbnail or paste link" className="form-control-premium" />
                <Button variant="outline-danger" onClick={() => { setSelectedMediaUrl(colorImage); setMediaTarget('color'); setShowMediaModal(true); }} className="d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}><IoFolderOpenOutline size={16} /> Library</Button>
              </div>
            </Form.Group>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Base Price (BDT) *</Form.Label>
                  <Form.Control type="number" value={colorPrice} onChange={(e) => setColorPrice(e.target.value)} min="0" placeholder="1100" className="form-control-premium" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Promo Price (BDT - Optional)</Form.Label>
                  <Form.Control type="number" value={colorDiscountPrice} onChange={(e) => setColorDiscountPrice(e.target.value)} min="0" placeholder="0" className="form-control-premium" />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="small fw-semibold d-block mb-2">Available Sizing (Sizing options linked to this color)</Form.Label>
              <div className="d-flex gap-4 p-3 bg-light rounded-3">
                {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                  <Form.Check 
                    key={size}
                    type="checkbox"
                    id={`edit-size-${size}`}
                    label={size}
                    checked={colorSizes.includes(size)}
                    onChange={(e) => handleSizeCheckboxChange(size, e.target.checked)}
                    className="fw-bold text-dark"
                  />
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mt-2">
              <Form.Check type="switch" id="edit-color-active-switch" label="Visible in Customizer colors list" checked={colorActive} onChange={(e) => setColorActive(e.target.checked)} className="fw-bold text-success" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowEditColorModal(false)}>Cancel</Button>
            <Button type="submit" disabled={savingColor} variant="danger" size="sm" className="bg-red-gradient border-0 px-4">{savingColor ? 'Saving...' : 'Save Changes'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ----------------------------------------------------
          7. MEDIA LIBRARY MODAL
      ---------------------------------------------------- */}
      <Modal show={showMediaModal} onHide={() => setShowMediaModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
            <IoImagesOutline /> Server Media Library
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex gap-2">
              <Button variant={activeMediaTab === 'library' ? 'danger' : 'outline-secondary'} onClick={() => setActiveMediaTab('library')} className={activeMediaTab === 'library' ? 'bg-red-gradient border-0' : ''} size="sm">Media Assets</Button>
              <Button variant={activeMediaTab === 'upload' ? 'danger' : 'outline-secondary'} onClick={() => setActiveMediaTab('upload')} className={activeMediaTab === 'upload' ? 'bg-red-gradient border-0' : ''} size="sm">Upload File</Button>
            </div>
          </div>

          {activeMediaTab === 'library' ? (
            <div className="d-grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', maxHeight: '350px', overflowY: 'auto', padding: '4px' }}>
              {mediaItems.length === 0 ? (
                <div className="text-center py-5 w-100 col-span-all">
                  <IoImagesOutline size={30} className="text-muted opacity-50 mb-1" />
                  <span className="text-muted d-block small">No images.</span>
                </div>
              ) : (
                mediaItems.map((m) => {
                  const fullUrl = m.url.startsWith('http') ? m.url : `${getBackendUrl()}${m.url}`;
                  const isSelected = selectedMediaUrl === m.url;
                  return (
                    <div key={m._id} onClick={() => setSelectedMediaUrl(m.url)} className={`position-relative rounded-3 border p-2 cursor-pointer transition-all ${isSelected ? 'border-danger bg-danger bg-opacity-10' : 'border-light bg-light hover-border-dark'}`} style={{ height: '130px', cursor: 'pointer' }}>
                      <img src={fullUrl} alt={m.name} className="w-100 h-100 object-fit-cover rounded" />
                      <Button variant="danger" size="sm" onClick={(e) => handleDeleteMedia(m._id, e)} className="position-absolute rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', right: '5px', top: '5px' }}><IoTrashOutline size={12} /></Button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="text-center py-5 border rounded-3 bg-light">
              <input type="file" id="design-media-upload-input" onChange={handleFileUpload} accept="image/*" className="d-none" />
              <label htmlFor="design-media-upload-input" className="btn btn-outline-danger px-4 py-2 cursor-pointer d-inline-flex align-items-center gap-2" style={{ cursor: 'pointer' }}><IoFolderOpenOutline size={18} /> {uploadingMedia ? 'Uploading...' : 'Select File from Computer'}</label>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowMediaModal(false)}>Close</Button>
          <Button variant="danger" size="sm" onClick={handleSelectMedia} className="bg-red-gradient border-0 px-4" disabled={!selectedMediaUrl}>Confirm Selection</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
