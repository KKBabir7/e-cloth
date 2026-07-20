'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import BrandLoader from '../../components/BrandLoader';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Row, Col, Card, Button, Form, Tabs, Tab, Modal, InputGroup, Nav } from 'react-bootstrap';
import {
  IoText, IoImage, IoSquare, IoTrash, IoArrowDown, IoArrowUp, IoPushOutline,
  IoChevronDown, IoDownload, IoCart, IoReload, IoSave, IoSearch, IoMove,
  IoAdd, IoCopy, IoSunnyOutline, IoContrastOutline, IoEyeOutline, IoResizeOutline, IoColorPaletteOutline,
  IoEllipse, IoTriangle, IoStar, IoHeart, IoHappyOutline, IoShapesOutline, IoCloudUploadOutline, IoLayersOutline
} from 'react-icons/io5';
import { FiAlignLeft, FiAlignCenter, FiAlignRight, FiEye, FiEyeOff, FiLock, FiUnlock } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/cartSlice';
import { useUI } from '../../context/UIContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getBackendUrl } from '@/utils/api';
import Tshirt3DViewer from '../../components/Tshirt3DViewer';
import CustomSelect from '../../components/CustomSelect';

// 100+ Premium Google Fonts for T-Shirt customization
const POPULAR_FONTS = [
  "Outfit", "Pacifico", "Lobster", "Bangers", "Rubik Mono One", "Creepster", 
  "Space Grotesk", "Cinzel", "Montserrat", "Satisfy", "Impact", "Courier New",
  "Roboto", "Open Sans", "Lato", "Oswald", "Lora", "PT Sans", "Playfair Display", 
  "Great Vibes", "Merriweather", "Noto Sans", "PT Serif", "Rubik", "Anton", 
  "Arimo", "Bebas Neue", "Special Elite", "Righteous", "Permanent Marker", 
  "Architects Daughter", "Press Start 2P", "Fredoka One", "Alkatra", "Dancing Script", 
  "Sacramento", "Shadows Into Light", "Kaushan Script", "Yellowtail", "Courgette", 
  "Allura", "Alex Brush", "Amatic SC", "Josefin Sans", "Cabin", "Quicksand", 
  "Abril Fatface", "Patua One", "Lilita One", "Cardo", "Crimson Text", "Vollkorn", 
  "Playball", "Berkshire Swash", "Carter One", "Titan One", "Lemonada", "Comfortaa", 
  "Philosopher", "Bad Script", "Grand Hotel", "Cookie", "Rochester", "Monoton", 
  "Ultra", "Fredericka the Great", "Stint Ultra Condensed", "Fascinate Inline", 
  "Fugaz One", "Black Ops One", "Rye", "Limelight", "Bungee", "Bungee Inline", 
  "Bungee Shade", "Vast Shadow", "Crete Round", "Acme", "Ubuntu", "Rajdhani", 
  "Maven Pro", "Hind", "Kanit", "Teko", "Yanone Kaffeesatz", "Cairo", "Changa", 
  "Exo 2", "Orbitron", "Audiowide", "Jura", "Syncopate", "Major Mono Display", 
];

const DEMO_STICKERS = [
  { name: "Fire", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.png" },
  { name: "Rocket", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.png" },
  { name: "Cool Sun", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.png" },
  { name: "Sparkles", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.png" },
  { name: "Alien", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f47d/512.png" },
  { name: "Tiger", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f42f/512.png" },
  { name: "Skull", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f480/512.png" },
  { name: "Heart Sparks", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f496/512.png" },
  { name: "Crown", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f451/512.png" },
  { name: "Game Controller", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ae/512.png" },
  { name: "Music Headphone", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3a7/512.png" },
  { name: "Pizza Slice", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f355/512.png" }
];

// Helper to dynamically load font link from Google Fonts on-demand
const loadFontDynamically = (fontName) => {
  if (typeof window === 'undefined') return Promise.resolve();
  
  const webSafe = ['Impact', 'Courier New', 'Times New Roman', 'Arial', 'Georgia', 'Verdana'];
  if (webSafe.includes(fontName)) {
    return Promise.resolve();
  }

  const linkId = `gfont-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700&display=swap`;
    link.onload = () => {
      if (document.fonts) {
        document.fonts.load(`1em "${fontName}"`)
          .then(() => resolve())
          .catch(() => resolve());
      } else {
        resolve();
      }
    };
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
};

// Helper to construct a single combined lightweight stylesheet for select dropdown previews (subsetted to font name)
const getFontsPreviewStylesheetUrl = () => {
  const baseUrl = "https://fonts.googleapis.com/css2?";
  const familyParams = POPULAR_FONTS.map(font => {
    if (['Impact', 'Courier New', 'Times New Roman', 'Arial', 'Georgia', 'Verdana'].includes(font)) return '';
    return `family=${encodeURIComponent(font)}&text=${encodeURIComponent(font)}`;
  }).filter(Boolean).join('&');
  return `${baseUrl}${familyParams}&display=swap`;
};

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

  const frontCanvasRef = useRef(null);
  const backCanvasRef = useRef(null);
  const [frontCanvas, setFrontCanvas] = useState(null);
  const [backCanvas, setBackCanvas] = useState(null);
  const activeObjectRef = useRef(null);
  const fileInputRef = useRef(null);
  const [tshirtView, setTshirtView] = useState('front'); // front or back
  const [tshirtColor, setTshirtColor] = useState('#ffffff');
  const [activeTab, setActiveTab] = useState('text');
  const [selectedSize, setSelectedSize] = useState('L');
  const [displayMode, setDisplayMode] = useState('2d'); // 2d or 3d
  const [garmentType, setGarmentType] = useState('tshirt'); // tshirt or polo
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState('text');
  const [isMounted, setIsMounted] = useState(false);
  const [mobileScale, setMobileScale] = useState(1);
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileMainTab, setMobileMainTab] = useState('design');

  // Mark as mounted after first client render to prevent hydration mismatch
  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateScale = () => {
      const isMobile = window.innerWidth < 992;
      setIsMobileView(isMobile);
      if (!isMobile) {
        setMobileScale(1);
        return;
      }
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Target box on mobile occupies the top 40% of the screen (height: 40vh)
      const boxWidth = windowWidth - 24;
      const boxHeight = windowHeight * 0.40;
      
      // Scale is based on fitting the 380x470 container inside the boxWidth x boxHeight
      const widthScale = boxWidth / 380;
      const heightScale = boxHeight / 470;
      
      // Cap scale at 1.0 to prevent blurriness on wider mobile screens
      const finalScale = Math.min(1.0, widthScale, heightScale);
      
      setMobileScale(finalScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [mobileDrawerOpen]);


  // Derived active canvas instance
  const canvas = tshirtView === 'front' ? frontCanvas : backCanvas;

  // Text Form States
  const [textInput, setTextInput] = useState('CUSTOMWEAR');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Outfit');
  const [fontWeight, setFontWeight] = useState('normal');
  const [textAlign, setTextAlign] = useState('center');
  const [fontStyle, setFontStyle] = useState('normal');
  const [isUnderline, setIsUnderline] = useState(false);
  const [isLinethrough, setIsLinethrough] = useState(false);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textBend, setTextBend] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [textOpacity, setTextOpacity] = useState(1);

  // Layer Panel States & Hooks
  const [layersList, setLayersList] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const layerPanelRef = useRef(null);

  // Image Adjustments States
  const [imageOpacity, setImageOpacity] = useState(1);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageBrightness, setImageBrightness] = useState(0);
  const [imageContrast, setImageContrast] = useState(0);
  const [imageSaturation, setImageSaturation] = useState(0);

  // Sticker Adjustments States
  const [stickerOpacity, setStickerOpacity] = useState(1);
  const [stickerScale, setStickerScale] = useState(1);
  const [stickerRotation, setStickerRotation] = useState(0);
  const [stickerBrightness, setStickerBrightness] = useState(0);
  const [stickerContrast, setStickerContrast] = useState(0);
  const [stickerSaturation, setStickerSaturation] = useState(0);

  // Shape Adjustments States
  const [shapeColor, setShapeColor] = useState('#ff8525');
  const [shapeOpacity, setShapeOpacity] = useState(1);
  const [shapeScale, setShapeScale] = useState(1);
  const [shapeRotation, setShapeRotation] = useState(0);
  const [shapeStrokeColor, setShapeStrokeColor] = useState('#ffffff');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(0);

  const { data: stickersData } = useQuery({
    queryKey: ['stickers'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/stickers`);
      return res.data.success ? res.data.stickers : [];
    }
  });

  const { data: colorsData } = useQuery({
    queryKey: ['fabricColors'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/fabric-colors`);
      return res.data.success ? res.data.colors : [];
    }
  });

  const { data: settingsData } = useQuery({
    queryKey: ['designSettings'],
    queryFn: async () => {
      const res = await axios.get(`${getBackendUrl()}/api/design-settings`);
      return res.data.success ? res.data.settings : { textPrice: 60, stickerPrice: 40 };
    }
  });

  const textPrice = settingsData ? settingsData.textPrice : 60;
  const stickerPrice = settingsData ? settingsData.stickerPrice : 40;
  const imagePrice = settingsData ? settingsData.imagePrice : 50;
  const shapePrice = settingsData ? settingsData.shapePrice : 30;
  const [textLinesCount, setTextLinesCount] = useState(0);
  const [stickersCount, setStickersCount] = useState(0);
  const [imagesCount, setImagesCount] = useState(0);
  const [shapesCount, setShapesCount] = useState(0);

  const stickersList = stickersData || [];
  const DEFAULT_COLORS = [
    { name: 'White', hex: '#ffffff', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Black', hex: '#0f172a', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Crimson', hex: '#dc2626', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Royal Blue', hex: '#1e3a8a', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Navy Gray', hex: '#475569', sizes: ['S', 'M', 'L', 'XL', 'XXL'] }
  ];
  const fabricColors = colorsData && colorsData.length > 0 ? colorsData : DEFAULT_COLORS;
  // Use DEFAULT_COLORS during SSR/initial CSR to prevent hydration text mismatch.
  // After isMounted is true (client-only), switch to actual fabricColors from API.
  const displayColors = isMounted ? fabricColors : DEFAULT_COLORS;

  useEffect(() => {
    if (colorsData && colorsData.length > 0) {
      const colorExists = colorsData.some(c => c.hex.toLowerCase() === tshirtColor.toLowerCase());
      if (!colorExists) {
        const firstColor = colorsData[0];
        setTshirtColor(firstColor.hex);
        if (firstColor.sizes && firstColor.sizes.length > 0) {
          setSelectedSize(firstColor.sizes[0]);
        }
      }
    }
  }, [colorsData]);

  // Close Layer Panel Dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (layerPanelRef.current && !layerPanelRef.current.contains(event.target)) {
        setShowLayerPanel(false);
      }
    };
    if (showLayerPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLayerPanel]);

  const toggleButtonRef = useRef(null);
  const [dropdownDirection, setDropdownDirection] = useState('down');

  const checkDropdownDirection = () => {
    if (!toggleButtonRef.current) return;
    const rect = toggleButtonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    // If space below is less than 290px (dropdown height + margin), show it above
    if (spaceBelow < 290) {
      setDropdownDirection('up');
    } else {
      setDropdownDirection('down');
    }
  };

  useEffect(() => {
    if (showLayerPanel) {
      checkDropdownDirection();
      // Listen to scroll & resize to dynamically re-evaluate space in real-time
      window.addEventListener('scroll', checkDropdownDirection, true);
      window.addEventListener('resize', checkDropdownDirection);
    }
    return () => {
      window.removeEventListener('scroll', checkDropdownDirection, true);
      window.removeEventListener('resize', checkDropdownDirection);
    };
  }, [showLayerPanel]);

  const updateLayersList = () => {
    if (!canvas) {
      setLayersList([]);
      setActiveLayerId(null);
      return;
    }
    const objects = canvas.getObjects();
    const list = objects.map((obj) => {
      let name = 'Layer';
      let type = 'shape';
      if (obj.type === 'i-text' || obj.type === 'text') {
        name = obj.text ? (obj.text.substring(0, 15) + (obj.text.length > 15 ? '...' : '')) : 'Text';
        type = 'text';
      } else if (obj.type === 'image') {
        name = 'Image';
        type = 'image';
      } else {
        name = obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
        type = 'shape';
      }
      return {
        id: obj,
        name,
        type,
        visible: obj.visible !== false,
        locked: obj.lockMovementX === true
      };
    });
    setLayersList(list.reverse());
    setActiveLayerId(canvas.getActiveObject());
  };

  const countTextLines = () => {
    let count = 0;
    const countCanvasLines = (c) => {
      if (!c) return 0;
      let lines = 0;
      c.getObjects().forEach(obj => {
        if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
          const textVal = obj.text || '';
          const lineList = textVal.split('\n').filter(line => line.trim().length > 0);
          lines += Math.max(1, lineList.length);
        }
      });
      return lines;
    };
    count += countCanvasLines(frontCanvas);
    count += countCanvasLines(backCanvas);
    return count;
  };

  const countStickers = () => {
    const countCanvasStickers = (c) => {
      if (!c) return 0;
      // Stickers have isSticker:true set by handleAddSticker
      return c.getObjects().filter(obj => obj.type === 'image' && obj.isSticker === true).length;
    };
    return countCanvasStickers(frontCanvas) + countCanvasStickers(backCanvas);
  };

  const countImages = () => {
    const countCanvasImages = (c) => {
      if (!c) return 0;
      // User-uploaded images: image type WITHOUT isSticker flag
      return c.getObjects().filter(obj => obj.type === 'image' && obj.isSticker !== true).length;
    };
    return countCanvasImages(frontCanvas) + countCanvasImages(backCanvas);
  };

  const countShapes = () => {
    const shapeTypes = new Set(['circle', 'rect', 'triangle', 'path', 'polygon', 'line', 'ellipse']);
    const countCanvasShapes = (c) => {
      if (!c) return 0;
      return c.getObjects().filter(obj => shapeTypes.has(obj.type)).length;
    };
    return countCanvasShapes(frontCanvas) + countCanvasShapes(backCanvas);
  };

  useEffect(() => {
    if (!canvas) return;

    updateLayersList();
    setTextLinesCount(countTextLines());
    setStickersCount(countStickers());
    setImagesCount(countImages());
    setShapesCount(countShapes());

    const handleCanvasChange = () => {
      updateLayersList();
      setTextLinesCount(countTextLines());
      setStickersCount(countStickers());
      setImagesCount(countImages());
      setShapesCount(countShapes());
    };

    canvas.on('object:added', handleCanvasChange);
    canvas.on('object:removed', handleCanvasChange);
    canvas.on('object:modified', handleCanvasChange);
    canvas.on('text:changed', handleCanvasChange);
    canvas.on('selection:created', handleCanvasChange);
    canvas.on('selection:updated', handleCanvasChange);
    canvas.on('selection:cleared', handleCanvasChange);

    return () => {
      canvas.off('object:added', handleCanvasChange);
      canvas.off('object:removed', handleCanvasChange);
      canvas.off('object:modified', handleCanvasChange);
      canvas.off('text:changed', handleCanvasChange);
      canvas.off('selection:created', handleCanvasChange);
      canvas.off('selection:updated', handleCanvasChange);
      canvas.off('selection:cleared', handleCanvasChange);
    };
  }, [canvas, frontCanvas, backCanvas]);

  const selectCanvasLayer = (canvasIdx) => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const obj = objects[canvasIdx];
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
    }
  };

  const toggleLayerVisibility = (canvasIdx) => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const obj = objects[canvasIdx];
    if (obj) {
      obj.set({ visible: obj.visible === false });
      canvas.discardActiveObject(); // Force refresh selection
      canvas.renderAll();
      canvas.fire('object:modified', { target: obj });
      updateLayersList();
    }
  };

  const toggleLayerLock = (canvasIdx) => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const obj = objects[canvasIdx];
    if (obj) {
      const isLocked = obj.lockMovementX === true;
      obj.set({
        lockMovementX: !isLocked,
        lockMovementY: !isLocked,
        lockScalingX: !isLocked,
        lockScalingY: !isLocked,
        lockRotation: !isLocked,
        hasControls: isLocked, // Show controls if unlocking
        selectable: isLocked   // Make selectable if unlocking
      });
      canvas.discardActiveObject();
      canvas.renderAll();
      canvas.fire('object:modified', { target: obj });
      updateLayersList();
      showToast(isLocked ? 'Layer unlocked!' : 'Layer locked!', 'info');
    }
  };

  const handleDragStart = (e, canvasIdx) => {
    e.dataTransfer.setData('text/plain', canvasIdx.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetCanvasIdx) => {
    e.preventDefault();
    const sourceStr = e.dataTransfer.getData('text/plain');
    if (!sourceStr) return;
    const sourceCanvasIdx = parseInt(sourceStr);
    if (sourceCanvasIdx === targetCanvasIdx) return;

    const objects = canvas.getObjects();
    const draggedObj = objects[sourceCanvasIdx];
    if (draggedObj) {
      // Discard selection first to avoid Fabric.js active group indexing bugs!
      canvas.discardActiveObject();
      
      draggedObj.moveTo(targetCanvasIdx);
      
      // Re-select object
      canvas.setActiveObject(draggedObj);
      
      canvas.renderAll();
      canvas.fire('object:modified', { target: draggedObj });
      updateLayersList();
    }
  };

  // Preview Modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewImgData, setPreviewImgData] = useState('');

  // Canvas State storage (front/back)
  const [frontDesignJson, setFrontDesignJson] = useState(null);
  const [backDesignJson, setBackDesignJson] = useState(null);

  // Initialize both Fabric.js Canvases
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fabric = require('fabric').fabric;

    const clampObject = (obj, maxHeight) => {
      if (!obj) return;
      const bounds = obj.getBoundingRect();
      if (obj.left < 0) {
        obj.left = 0;
      } else if (obj.left + bounds.width > 240) {
        obj.left = 240 - bounds.width;
      }
      if (obj.top < 0) {
        obj.top = 0;
      } else if (obj.top + bounds.height > maxHeight) {
        obj.top = maxHeight - bounds.height;
      }
    };

    const syncSidebarFromObject = (canvasInstance) => {
      const obj = canvasInstance.getActiveObject();
      if (!obj) return;
      if (obj.type === 'i-text' || obj.type === 'text') {
        setActiveTab('text');
        setMobileActiveTab('text');
        setMobileDrawerOpen(true);
        activeObjectRef.current = obj;
        setTextInput(obj.text || '');
        setTextColor(obj.fill || '#000000');
        setFontSize(obj.fontSize || 24);
        setFontFamily(obj.fontFamily || 'Outfit');
        setFontWeight(obj.fontWeight || 'normal');
        setTextAlign(obj.textAlign || 'center');
        setFontStyle(obj.fontStyle || 'normal');
        setIsUnderline(!!obj.underline);
        setIsLinethrough(!!obj.linethrough);
        setLetterSpacing((obj.charSpacing || 0) / 10);
        setTextBend(obj.textBend || 0);
        setStrokeColor(obj.stroke || '#ffffff');
        setStrokeWidth(obj.strokeWidth || 0);
        setTextOpacity(obj.opacity !== undefined ? obj.opacity : 1);
      } else if (obj.type === 'image') {
        if (obj.isSticker) {
          setActiveTab('sticker');
          setMobileActiveTab('layers');
          setMobileDrawerOpen(true);
          setStickerOpacity(obj.opacity !== undefined ? obj.opacity : 1);
          setStickerScale(obj.scaleX !== undefined ? obj.scaleX : 1);
          setStickerRotation(obj.angle !== undefined ? obj.angle : 0);
          
          const brightF = obj.filters && obj.filters.find(f => f && (f.type === 'Brightness' || f.brightness !== undefined));
          setStickerBrightness(brightF ? brightF.brightness : 0);
          
          const contrastF = obj.filters && obj.filters.find(f => f && (f.type === 'Contrast' || f.contrast !== undefined));
          setStickerContrast(contrastF ? contrastF.contrast : 0);
 
          const saturationF = obj.filters && obj.filters.find(f => f && (f.type === 'Saturation' || f.saturation !== undefined));
          setStickerSaturation(saturationF ? saturationF.saturation : 0);
        } else {
          setActiveTab('image');
          setMobileActiveTab('layers');
          setMobileDrawerOpen(true);
          setImageOpacity(obj.opacity !== undefined ? obj.opacity : 1);
          setImageScale(obj.scaleX !== undefined ? obj.scaleX : 1);
          setImageRotation(obj.angle !== undefined ? obj.angle : 0);
          
          const brightF = obj.filters && obj.filters.find(f => f && (f.type === 'Brightness' || f.brightness !== undefined));
          setImageBrightness(brightF ? brightF.brightness : 0);
          
          const contrastF = obj.filters && obj.filters.find(f => f && (f.type === 'Contrast' || f.contrast !== undefined));
          setImageContrast(contrastF ? contrastF.contrast : 0);
 
          const saturationF = obj.filters && obj.filters.find(f => f && (f.type === 'Saturation' || f.saturation !== undefined));
          setImageSaturation(saturationF ? saturationF.saturation : 0);
        }
      } else {
        setActiveTab('shape');
        setMobileActiveTab('layers');
        setMobileDrawerOpen(true);
        setShapeColor(obj.fill || '#ff8525');
        setShapeOpacity(obj.opacity !== undefined ? obj.opacity : 1);
        setShapeScale(obj.scaleX !== undefined ? obj.scaleX : 1);
        setShapeRotation(obj.angle !== undefined ? obj.angle : 0);
        setShapeStrokeColor(obj.stroke || '#ffffff');
        setShapeStrokeWidth(obj.strokeWidth !== undefined ? obj.strokeWidth : 0);
      }
    };

    const handleObjectScaling = (canvasInstance) => (e) => {
      const obj = e.target;
      if (!obj) return;
      clampObject(obj, 440);
      if (obj.type === 'i-text' || obj.type === 'text') {
        const effectiveSize = Math.round(obj.fontSize * obj.scaleX);
        setFontSize(effectiveSize);
      }
    };

    const handleObjectModified = (canvasInstance) => (e) => {
      const obj = e.target;
      if (!obj) return;
      if (obj.type === 'i-text' || obj.type === 'text') {
        const effectiveSize = Math.round(obj.fontSize * obj.scaleX);
        obj.set({
          fontSize: effectiveSize,
          scaleX: 1,
          scaleY: 1
        });
        canvasInstance.renderAll();
        setFontSize(effectiveSize);
      }
    };

    // 1. Initialize Front Canvas
    const fCanvas = new fabric.Canvas(frontCanvasRef.current, {
      width: 240,
      height: 440,
      backgroundColor: 'transparent',
      selection: true,
      preserveObjectStacking: true
    });
    setFrontCanvas(fCanvas);

    fCanvas.on('object:moving', (e) => clampObject(e.target, 440));
    fCanvas.on('object:scaling', handleObjectScaling(fCanvas));
    fCanvas.on('object:modified', handleObjectModified(fCanvas));
    fCanvas.on('selection:created', () => syncSidebarFromObject(fCanvas));
    fCanvas.on('selection:updated', () => syncSidebarFromObject(fCanvas));
    fCanvas.on('selection:cleared', () => {
      activeObjectRef.current = null;
      setTextInput('CUSTOMWEAR');
    });

    // Initial Welcome Text on Front
    const text = new fabric.IText('Your Text', {
      top: 130,
      fontSize: 24,
      fontFamily: 'Outfit',
      fill: '#000000',
      textAlign: 'center',
      editable: true
    });
    text.set({ left: (240 - text.width * text.scaleX) / 2 });
    fCanvas.add(text);
    fCanvas.setActiveObject(text);

    // 2. Initialize Back Canvas
    const bCanvas = new fabric.Canvas(backCanvasRef.current, {
      width: 240,
      height: 440,
      backgroundColor: 'transparent',
      selection: true,
      preserveObjectStacking: true
    });
    setBackCanvas(bCanvas);

    bCanvas.on('object:moving', (e) => clampObject(e.target, 440));
    bCanvas.on('object:scaling', handleObjectScaling(bCanvas));
    bCanvas.on('object:modified', handleObjectModified(bCanvas));
    bCanvas.on('selection:created', () => syncSidebarFromObject(bCanvas));
    bCanvas.on('selection:updated', () => syncSidebarFromObject(bCanvas));
    bCanvas.on('selection:cleared', () => {
      activeObjectRef.current = null;
      setTextInput('CUSTOMWEAR');
    });

    return () => {
      fCanvas.dispose();
      bCanvas.dispose();
    };
  }, []);

  // Dynamically load default fonts & combined previews on mount
  useEffect(() => {
    // 1. Preload active defaults
    loadFontDynamically('Outfit');
    loadFontDynamically('Pacifico');
    loadFontDynamically('Lobster');

    // 2. Load lightweight combined preview stylesheet
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.id = 'gfonts-dropdown-previews';
      link.rel = 'stylesheet';
      link.href = getFontsPreviewStylesheetUrl();
      document.head.appendChild(link);
    }
  }, []);

  // Load saved design if redesign query param is present
  useEffect(() => {
    if (!frontCanvas || !backCanvas) return;
    const redesignId = searchParams.get('redesign');
    if (!redesignId) return;

    const loadSavedDesign = async () => {
      try {
        showToast('Loading saved design...', 'info');
        const res = await axios.get(`${getBackendUrl()}/api/design/${redesignId}`, { withCredentials: true });
        if (res.data.success) {
          const design = res.data.design;
          
          // 1. Set fabric color, garment type, etc.
          if (design.tshirtColor) setTshirtColor(design.tshirtColor);
          if (design.garmentType) setGarmentType(design.garmentType);
          
          // Helper to wrap loadFromJSON in a Promise
          const loadCanvasPromise = (canvasInstance, json) => {
            return new Promise((resolve) => {
              if (!json) return resolve();
              canvasInstance.loadFromJSON(json, () => {
                canvasInstance.renderAll();
                resolve();
              });
            });
          };

          // 2. Load canvas JSON in parallel
          await Promise.all([
            loadCanvasPromise(frontCanvas, design.canvasJson?.front),
            loadCanvasPromise(backCanvas, design.canvasJson?.back)
          ]);

          // Normalize isSticker and override toObject for loaded image/sticker objects
          [frontCanvas, backCanvas].forEach(c => {
            if (!c) return;
            c.getObjects().forEach(obj => {
              if (obj.type === 'image') {
                const srcStr = obj.src || (obj._element && obj._element.src);
                const isSticker = obj.isSticker || (typeof srcStr === 'string' && !srcStr.startsWith('data:'));
                if (isSticker) {
                  obj.isSticker = true;
                  obj.stickerUrl = obj.stickerUrl || srcStr;
                  
                  // Re-override toObject so it continues to serialize correctly if saved again
                  const fabric = require('fabric').fabric;
                  obj.toObject = (function(toObject) {
                    return function() {
                      return fabric.util.object.extend(toObject.call(this), {
                        isSticker: true,
                        stickerUrl: this.stickerUrl
                      });
                    };
                  })(obj.toObject);
                }
              }
            });
          });
          
          // 3. Auto-select first loaded layer to sync editor sidebar panels
          const frontObjects = frontCanvas.getObjects();
          const backObjects = backCanvas.getObjects();
          
          if (frontObjects.length > 0) {
            setTshirtView('front');
            const firstText = frontObjects.find(obj => obj.type === 'i-text' || obj.type === 'text');
            const target = firstText || frontObjects[0];
            if (target) {
              frontCanvas.setActiveObject(target);
              frontCanvas.renderAll();
              syncSidebarFromObject(frontCanvas);
            }
          } else if (backObjects.length > 0) {
            setTshirtView('back');
            const firstText = backObjects.find(obj => obj.type === 'i-text' || obj.type === 'text');
            const target = firstText || backObjects[0];
            if (target) {
              backCanvas.setActiveObject(target);
              backCanvas.renderAll();
              syncSidebarFromObject(backCanvas);
            }
          }
          
          showToast('Design loaded successfully!', 'success');
        }
      } catch (err) {
        console.error('Error loading redesign:', err);
        showToast(`Failed to load saved design: ${err.message}`, 'error');
      }
    };

    loadSavedDesign();
  }, [frontCanvas, backCanvas, searchParams]);

  // Mobile Bottom Sheet control functions
  const toggleMobileTab = (tab) => {
    if (mobileActiveTab === tab && mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    } else {
      setMobileActiveTab(tab);
      setMobileDrawerOpen(true);
    }
  };

  const deleteCanvasLayer = (idx) => {
    if (canvas) {
      const obj = canvas.item(idx);
      if (obj) {
        canvas.remove(obj);
        canvas.discardActiveObject();
        canvas.renderAll();
        showToast('Layer deleted successfully', 'success');
      }
    }
  };

  

  // Add Layer: Text
  const handleAddText = async () => {
    if (!canvas) return;
    const fabric = require('fabric').fabric;
    
    showToast('Loading font style...', 'info');
    await loadFontDynamically(fontFamily);

    const text = new fabric.IText(textInput || 'Your Text', {
      left: 50,
      top: 100,
      fontFamily: fontFamily,
      fontSize: parseInt(fontSize),
      fill: textColor,
      fontWeight: fontWeight,
      textAlign: textAlign,
      fontStyle: fontStyle,
      underline: isUnderline,
      linethrough: isLinethrough,
      charSpacing: letterSpacing * 10,
      stroke: strokeWidth > 0 ? strokeColor : null,
      strokeWidth: strokeWidth,
      editable: true
    });

    // Apply horizontal alignment relative to 240px print area
    if (textAlign === 'center') {
      text.set({ left: (240 - text.width * text.scaleX) / 2 });
    } else if (textAlign === 'left') {
      text.set({ left: 0 });
    } else if (textAlign === 'right') {
      text.set({ left: 240 - text.width * text.scaleX });
    }

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    showToast('Text layer added!', 'success');

    // RESET formatting states so that the next added text doesn't inherit previous styles
    setTextInput('CUSTOMWEAR');
    setTextColor('#000000');
    setFontSize(24);
    setFontFamily('Outfit');
    setFontWeight('normal');
    setTextAlign('center');
    setFontStyle('normal');
    setIsUnderline(false);
    setIsLinethrough(false);
    setLetterSpacing(0);
    setTextBend(0);
    setStrokeColor('#ffffff');
    setStrokeWidth(0);
  };

  // Update Active Layer Text Styles (loads Google Fonts dynamically)
  useEffect(() => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'text')) {
      if (activeObj !== activeObjectRef.current) {
        activeObjectRef.current = activeObj;
        return;
      }
      if (document.fonts) {
        document.fonts.load(`1em "${fontFamily}"`).then(() => {
          const updatedProps = {
            text: textInput,
            fill: textColor,
            fontFamily: fontFamily,
            fontWeight: fontWeight,
            textAlign: textAlign,
            fontStyle: fontStyle,
            underline: isUnderline,
            linethrough: isLinethrough,
            charSpacing: letterSpacing * 10,
            stroke: strokeWidth > 0 ? strokeColor : null,
            strokeWidth: strokeWidth,
            textBend: textBend
          };

          const isUserDragging = canvas._currentTransform !== undefined && canvas._currentTransform !== null;
          if (!isUserDragging) {
            updatedProps.fontSize = parseInt(fontSize);
            updatedProps.scaleX = 1;
            updatedProps.scaleY = 1;
          }

          activeObj.set(updatedProps);

          // Apply text bending (curved text)
          if (textBend === 0) {
            activeObj.set({ path: null });
          } else {
            activeObj.set({ path: null });
            const textWidth = activeObj.width || 100;
            const maxAngle = 359.99;
            const angleDeg = (textBend / 100) * maxAngle;
            const angleRad = angleDeg * Math.PI / 180;
            const R = textWidth / Math.abs(angleRad);
            const X = 2 * R * Math.sin(Math.abs(angleRad) / 2);
            const largeArcFlag = Math.abs(angleDeg) > 180 ? 1 : 0;
            const sweepFlag = textBend > 0 ? 1 : 0;
            const fabric = require('fabric').fabric;
            const path = new fabric.Path(`M 0 0 A ${R} ${R} 0 ${largeArcFlag} ${sweepFlag} ${X} 0`, {
              visible: false, fill: '', stroke: ''
            });
            activeObj.set({ path: path });
          }

          // Apply horizontal alignment relative to 240px print area
          if (textAlign === 'center') {
            activeObj.set({ left: (240 - activeObj.width * activeObj.scaleX) / 2 });
          } else if (textAlign === 'left') {
            activeObj.set({ left: 0 });
          } else if (textAlign === 'right') {
            activeObj.set({ left: 240 - activeObj.width * activeObj.scaleX });
          }

          canvas.renderAll();
        });
      } else {
        const updatedProps = {
          text: textInput,
          fill: textColor,
          fontFamily: fontFamily,
          fontWeight: fontWeight,
          textAlign: textAlign,
          fontStyle: fontStyle,
          underline: isUnderline,
          linethrough: isLinethrough,
          charSpacing: letterSpacing * 10,
          stroke: strokeWidth > 0 ? strokeColor : null,
          strokeWidth: strokeWidth,
          textBend: textBend
        };

        const isUserDragging = canvas._currentTransform !== undefined && canvas._currentTransform !== null;
        if (!isUserDragging) {
          updatedProps.fontSize = parseInt(fontSize);
          updatedProps.scaleX = 1;
          updatedProps.scaleY = 1;
        }

        activeObj.set(updatedProps);

        // Apply text bending (curved text)
        if (textBend === 0) {
          activeObj.set({ path: null });
        } else {
          activeObj.set({ path: null });
          const textWidth = activeObj.width || 100;
          const maxAngle = 359.99;
          const angleDeg = (textBend / 100) * maxAngle;
          const angleRad = angleDeg * Math.PI / 180;
          const R = textWidth / Math.abs(angleRad);
          const X = 2 * R * Math.sin(Math.abs(angleRad) / 2);
          const largeArcFlag = Math.abs(angleDeg) > 180 ? 1 : 0;
          const sweepFlag = textBend > 0 ? 1 : 0;
          const fabric = require('fabric').fabric;
          const path = new fabric.Path(`M 0 0 A ${R} ${R} 0 ${largeArcFlag} ${sweepFlag} ${X} 0`, {
            visible: false, fill: '', stroke: ''
          });
          activeObj.set({ path: path });
        }

        // Apply horizontal alignment relative to 240px print area
        if (textAlign === 'center') {
          activeObj.set({ left: (240 - activeObj.width * activeObj.scaleX) / 2 });
        } else if (textAlign === 'left') {
          activeObj.set({ left: 0 });
        } else if (textAlign === 'right') {
          activeObj.set({ left: 240 - activeObj.width * activeObj.scaleX });
        }

        canvas.renderAll();
      }
    }
  }, [textInput, textColor, fontSize, fontFamily, fontWeight, textAlign, fontStyle, isUnderline, isLinethrough, letterSpacing, textBend, strokeColor, strokeWidth, canvas]);

  // Add Layer: Shape (Circle / Square / Star)
  const handleAddShape = (shapeType) => {
    if (!canvas) return;
    const fabric = require('fabric').fabric;
    let shape;

    if (shapeType === 'circle') {
      shape = new fabric.Circle({
        radius: 40,
        fill: '#ff8525',
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
    } else if (shapeType === 'triangle') {
      shape = new fabric.Triangle({
        width: 80,
        height: 80,
        fill: '#1e3a8a',
        left: 80,
        top: 80
      });
    } else if (shapeType === 'star') {
      shape = new fabric.Path('M 125,5 155,90 245,90 175,140 200,225 125,175 50,225 75,140 5,90 95,90 z', {
        fill: '#fbbf24',
        left: 80,
        top: 80,
        scaleX: 0.4,
        scaleY: 0.4
      });
    } else if (shapeType === 'heart') {
      shape = new fabric.Path('M 12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 z', {
        fill: '#dc2626',
        left: 80,
        top: 80,
        scaleX: 4,
        scaleY: 4
      });
    } else if (shapeType === 'pentagon') {
      shape = new fabric.Path('M 50 0 L 98 35 L 80 90 L 20 90 L 2 35 Z', {
        fill: '#ff8525',
        left: 80,
        top: 80,
        scaleX: 0.8,
        scaleY: 0.8
      });
    } else if (shapeType === 'hexagon') {
      shape = new fabric.Path('M 50 0 L 93 25 L 93 75 L 50 100 L 7 75 L 7 25 Z', {
        fill: '#0ea5e9',
        left: 80,
        top: 80,
        scaleX: 0.8,
        scaleY: 0.8
      });
    } else if (shapeType === 'octagon') {
      shape = new fabric.Path('M 30 0 L 70 0 L 100 30 L 100 70 L 70 100 L 30 100 L 0 70 L 0 30 Z', {
        fill: '#8b5cf6',
        left: 80,
        top: 80,
        scaleX: 0.8,
        scaleY: 0.8
      });
    } else if (shapeType === 'diamond') {
      shape = new fabric.Path('M 50 0 L 100 50 L 50 100 L 0 50 Z', {
        fill: '#ec4899',
        left: 80,
        top: 80,
        scaleX: 0.8,
        scaleY: 0.8
      });
    } else if (shapeType === 'arrow') {
      shape = new fabric.Path('M 0 35 L 60 35 L 60 10 L 100 50 L 60 90 L 60 65 L 0 65 Z', {
        fill: '#10b981',
        left: 80,
        top: 80,
        scaleX: 0.8,
        scaleY: 0.8
      });
    } else if (shapeType === 'cross') {
      shape = new fabric.Path('M 35 0 L 65 0 L 65 35 L 100 35 L 100 65 L 65 65 L 65 100 L 35 100 L 35 65 L 0 65 L 0 35 L 35 35 Z', {
        fill: '#f59e0b',
        left: 80,
        top: 80,
        scaleX: 0.8,
        scaleY: 0.8
      });
    } else if (shapeType === 'ring') {
      shape = new fabric.Path('M 50 0 A 50 50 0 1 0 50 100 A 50 50 0 1 0 50 0 Z M 50 25 A 25 25 0 1 1 50 75 A 25 25 0 1 1 50 25 Z', {
        fill: '#6366f1',
        left: 80,
        top: 80,
        scaleX: 0.8,
        scaleY: 0.8
      });
    }
    
    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      showToast(`${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} shape added!`, 'success');
    }
  };

  // Add Layer: Sticker
  const handleAddSticker = (url) => {
    if (!canvas) return;
    const fabric = require('fabric').fabric;
    
    fabric.Image.fromURL(url, (img) => {
      img.set({
        left: 80,
        top: 80,
        scaleX: 0.20,
        scaleY: 0.20,
        isSticker: true,
        stickerUrl: url
      });
      
      // Override toObject so it saves and loads isSticker properly
      img.toObject = (function(toObject) {
        return function() {
          return fabric.util.object.extend(toObject.call(this), {
            isSticker: true,
            stickerUrl: this.stickerUrl
          });
        };
      })(img.toObject);

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      showToast('Sticker added!', 'success');
    }, { crossOrigin: 'anonymous' });
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

    if (action === 'bringToFront') {
      canvas.bringToFront(activeObj);
      canvas.fire('object:modified', { target: activeObj });
      canvas.requestRenderAll();
      showToast('Layer moved to front', 'success');
    } else if (action === 'sendToBack') {
      canvas.sendToBack(activeObj);
      canvas.fire('object:modified', { target: activeObj });
      canvas.requestRenderAll();
      showToast('Layer sent to back', 'success');
    } else if (action === 'delete') {
      canvas.remove(activeObj);
      canvas.discardActiveObject();
      showToast('Layer deleted', 'success');
    } else if (action === 'duplicate') {
      activeObj.clone((clonedObj) => {
        canvas.discardActiveObject();
        clonedObj.set({
          left: clonedObj.left + 15,
          top: clonedObj.top + 15,
          evented: true
        });
        if (clonedObj.type === 'activeSelection') {
          clonedObj.canvas = canvas;
          clonedObj.forEachObject((obj) => {
            canvas.add(obj);
          });
          clonedObj.setCoords();
        } else {
          canvas.add(clonedObj);
        }
        canvas.setActiveObject(clonedObj);
        canvas.requestRenderAll();
        showToast('Layer duplicated!', 'success');
      });
    }
    
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
        ctx.drawImage(img, 120, 50, 240, 440);
        resolve(tempCanvas.toDataURL('image/png'));
      };
    });
  };

  const handleOpenPreview = () => {
    setShowPreview(true);
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
      const frontJson = frontCanvas ? frontCanvas.toJSON() : null;
      const backJson = backCanvas ? backCanvas.toJSON() : null;
      const canvasJson = { front: frontJson, back: backJson };

      // 1. Create Custom Order in Backend
      const res = await axios.post(`${getBackendUrl()}/api/custom-orders/cart`, {
        productId: productId || null,
        productType: garmentType,
        color: tshirtColor,
        size: selectedSize,
        quantity: 1,
        price: 1100, // Will recalculate base below
        canvasJson,
        previewImage: previewImg
      });

      if (res.data.success) {
        const customOrderRecord = res.data.customOrder;

        // Extract color price
        const currentColorObj = fabricColors.find(c => c.hex.toLowerCase() === tshirtColor.toLowerCase()) || fabricColors[0] || { price: 1100, discountPrice: 0 };
        const basePrice = currentColorObj.discountPrice > 0 && currentColorObj.discountPrice < currentColorObj.price
          ? currentColorObj.discountPrice
          : (currentColorObj.price || 1100);
        
        const finalPrice = basePrice + (textLinesCount * textPrice) + (stickersCount * stickerPrice) + (imagesCount * imagePrice) + (shapesCount * shapePrice);

        // 2. Push Saved ID into global Redux Cart Slice
        dispatch(addToCart({
          productId: productId || 'custom-apparel-001',
          name: `Custom Premium ${garmentType === 'polo' ? 'Polo' : 'T-Shirt'} (${tshirtColor === '#ffffff' ? 'White' : 'Colored'})`,
          price: finalPrice, // Dynamic pricing per color + text charges!
          image: previewImg,
          size: selectedSize,
          color: tshirtColor,
          quantity: 1,
          isCustom: true,
          customDesignId: customOrderRecord._id, // This is now the CustomOrder ID
          garmentType: garmentType
        }));

        showToast('Custom T-Shirt added to cart!', 'success');
        router.push('/cart');
      }
    } catch (err) {
      console.error('Add custom cart error:', err);
      showToast('Error saving canvas configurations', 'error');
    }
  };

  // Save design to user account (without adding to cart)
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const handleSaveDesign = async () => {
    if (!canvas) return;
    if (!isAuthenticated) {
      showToast('Please login to save your design', 'error');
      router.push('/login?redirect=/design');
      return;
    }
    try {
      setIsSavingDesign(true);
      showToast('Saving your design...', 'info');
      const previewImg = await generatePreview();
      const frontJson = frontCanvas ? frontCanvas.toJSON() : null;
      const backJson = backCanvas ? backCanvas.toJSON() : null;
      const canvasJson = { front: frontJson, back: backJson };
      const res = await axios.post(`${getBackendUrl()}/api/design/save`, {
        productId: productId || null,
        canvasJson,
        previewImage: previewImg,
        garmentType: garmentType,
        tshirtColor: tshirtColor
      });
      if (res.data.success) {
        showToast('✅ Design saved to your account!', 'success');
      }
    } catch (err) {
      console.error('Save design error:', err);
      showToast('Error saving design', 'error');
    } finally {
      setIsSavingDesign(false);
    }
  };

  const containerWidth = 380;
  const containerHeight = 470;

  

  const TextTabContent = () => (
    <>
      
                <Form className="d-flex flex-column gap-3 pt-2">
                  <Form.Group>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <Form.Label className="small fw-semibold m-0">Text Content</Form.Label>
                      <button 
                        type="button" 
                        className="btn-format-tool active"
                        style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                        onClick={handleAddText}
                        title="Add Text Layer"
                      >
                        <IoAdd size={16} />
                      </button>
                    </div>
                    <Form.Control
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="form-control-premium"
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="small fw-semibold">Font Family</Form.Label>
                    <CustomSelect
                      value={fontFamily}
                      options={POPULAR_FONTS.map(font => ({
                        value: font,
                        label: font,
                        style: { fontFamily: `"${font}", sans-serif` }
                      }))}
                      onChange={async (newFont) => {
                        showToast('Loading font style...', 'info');
                        await loadFontDynamically(newFont);
                        setFontFamily(newFont);
                      }}
                      hasSearch={true}
                    />
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
                        <CustomSelect
                          value={fontWeight}
                          options={[
                            { value: 'normal', label: 'Normal' },
                            { value: 'bold', label: 'Bold' }
                          ]}
                          onChange={(newWeight) => setFontWeight(newWeight)}
                          hasSearch={false}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* 6 Inline Formatting Buttons */}
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-secondary mb-2">Text Formatting</Form.Label>
                    <div className="d-flex align-items-center gap-1">
                      {/* Alignment */}
                      <button 
                        type="button"
                        className={`btn-format-tool ${textAlign === 'left' ? 'active' : ''}`}
                        onClick={() => setTextAlign('left')}
                        title="Align Left"
                      >
                        <FiAlignLeft size={14} />
                      </button>
                      <button 
                        type="button"
                        className={`btn-format-tool ${textAlign === 'center' ? 'active' : ''}`}
                        onClick={() => setTextAlign('center')}
                        title="Align Center"
                      >
                        <FiAlignCenter size={14} />
                      </button>
                      <button 
                        type="button"
                        className={`btn-format-tool ${textAlign === 'right' ? 'active' : ''}`}
                        onClick={() => setTextAlign('right')}
                        title="Align Right"
                      >
                        <FiAlignRight size={14} />
                      </button>
                      
                      {/* Vertical Divider */}
                      <div className="mx-1" style={{ height: '20px', width: '1px', backgroundColor: '#CBD5E1' }} />
                      
                      {/* Styles */}
                      <button 
                        type="button"
                        className={`btn-format-tool fw-bold ${fontStyle === 'italic' ? 'active' : ''}`}
                        onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                        title="Italic"
                      >
                        I
                      </button>
                      <button 
                        type="button"
                        className={`btn-format-tool fw-bold ${isUnderline ? 'active' : ''}`}
                        onClick={() => setIsUnderline(!isUnderline)}
                        title="Underline"
                      >
                        U
                      </button>
                      <button 
                        type="button"
                        className={`btn-format-tool fw-bold ${isLinethrough ? 'active' : ''}`}
                        onClick={() => setIsLinethrough(!isLinethrough)}
                        title="Strikethrough"
                      >
                        S
                      </button>
                    </div>
                  </Form.Group>

                  {/* Letter Spacing & Text Bend */}
                  <Row className="g-3">
                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0">Spacing</Form.Label>
                          <span className="small text-dark fw-bold">{letterSpacing}px</span>
                        </div>
                        <Form.Range 
                          min={-5} 
                          max={20} 
                          value={letterSpacing}
                          onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0">Text Bend</Form.Label>
                          <span className="small text-dark fw-bold">{textBend}</span>
                        </div>
                        <Form.Range 
                          min={-100} 
                          max={100} 
                          value={textBend}
                          onChange={(e) => setTextBend(parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Font Color */}
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-secondary mb-2">Font Color</Form.Label>
                    <div className="d-flex align-items-center form-control-premium w-100" style={{ gap: '12px', minHeight: '42px', position: 'relative', backgroundColor: '#ffffff' }}>
                      <div 
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          backgroundColor: textColor, 
                          border: '1px solid #CBD5E1',
                          position: 'relative',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            left: '-5px',
                            width: '34px',
                            height: '34px',
                            opacity: 0,
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="border-0 p-0 text-uppercase fw-semibold text-secondary w-100"
                        style={{ fontSize: '13px', outline: 'none', background: 'transparent' }}
                        placeholder="#000000"
                      />
                    </div>
                  </Form.Group>

                  {/* Stroke Outline Options */}
                  <Form.Group className="w-100">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Form.Label className="small fw-semibold text-secondary m-0">Stroke Width</Form.Label>
                      <span className="small text-dark fw-bold">{strokeWidth}px</span>
                    </div>
                    <Form.Range 
                      min={0} 
                      max={8} 
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    />
                  </Form.Group>

                  <Form.Group className="w-100">
                    <Form.Label className="small fw-semibold text-secondary mb-1">Stroke Color</Form.Label>
                    <div 
                      className="d-flex align-items-center form-control-premium w-100" 
                      style={{ 
                        gap: '10px', 
                        minHeight: '38px', 
                        position: 'relative',
                        backgroundColor: strokeWidth === 0 ? '#F1F5F9' : '#ffffff',
                        opacity: strokeWidth === 0 ? 0.7 : 1
                      }}
                    >
                      <div 
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '50%', 
                          backgroundColor: strokeColor, 
                          border: '1px solid #CBD5E1',
                          position: 'relative',
                          cursor: strokeWidth === 0 ? 'not-allowed' : 'pointer',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        <input
                          type="color"
                          value={strokeColor}
                          onChange={(e) => setStrokeColor(e.target.value)}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            left: '-5px',
                            width: '30px',
                            height: '30px',
                            opacity: 0,
                            cursor: strokeWidth === 0 ? 'not-allowed' : 'pointer'
                          }}
                          disabled={strokeWidth === 0}
                        />
                      </div>
                      <input
                        type="text"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="border-0 p-0 text-uppercase fw-semibold text-secondary w-100"
                        style={{ fontSize: '12px', outline: 'none', background: 'transparent' }}
                        placeholder="#FFFFFF"
                        disabled={strokeWidth === 0}
                      />
                    </div>
                  </Form.Group>

                </Form>
              
    </>
  );

  const ImageTabContent = () => (
    <>
      
                <div className="d-flex flex-column gap-3 pt-2">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-secondary mb-2">Upload Local Image</Form.Label>
                    <div 
                      className="border border-dashed rounded-3 p-3 text-center"
                      style={{ 
                        borderColor: '#CBD5E1', 
                        backgroundColor: '#F8FAFC',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderStyle: 'dashed',
                        borderWidth: '2px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#ff8525';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 133, 37, 0.03)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#CBD5E1';
                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      <IoImage size={28} className="text-secondary mb-2" style={{ color: '#94A3B8' }} />
                      <div className="small fw-bold text-dark mb-1">Click to upload image</div>
                      <div className="text-muted" style={{ fontSize: '10px' }}>Supports PNG/JPG with transparent backdrop</div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </Form.Group>

                  {/* Image Adjustments Sliders in a 2-Column Grid */}
                  <Row className="g-2">
                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoEyeOutline size={12} className="text-secondary" /> Opacity
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(imageOpacity * 100)}%</span>
                        </div>
                        <Form.Range 
                          min={0.1} 
                          max={1.0} 
                          step={0.05}
                          value={imageOpacity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setImageOpacity(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image') {
                                activeObj.set({ opacity: val });
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoResizeOutline size={12} className="text-secondary" /> Scale
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(imageScale * 100)}%</span>
                        </div>
                        <Form.Range 
                          min={0.05} 
                          max={2.0} 
                          step={0.05}
                          value={imageScale}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setImageScale(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image') {
                                activeObj.set({ scaleX: val, scaleY: val });
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoReload size={12} className="text-secondary" /> Rotate
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{imageRotation}Â°</span>
                        </div>
                        <Form.Range 
                          min={0} 
                          max={360} 
                          step={1}
                          value={imageRotation}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setImageRotation(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image') {
                                activeObj.set({ angle: val });
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoSunnyOutline size={12} className="text-secondary" /> Brightness
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(imageBrightness * 100)}%</span>
                        </div>
                        <Form.Range 
                          min={-1.0} 
                          max={1.0} 
                          step={0.05}
                          value={imageBrightness}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setImageBrightness(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image') {
                                const fabric = require('fabric').fabric;
                                activeObj.filters = (activeObj.filters || []).filter(f => f && f.type !== 'Brightness');
                                if (val !== 0) {
                                  activeObj.filters.push(new fabric.Image.filters.Brightness({ brightness: val }));
                                }
                                activeObj.applyFilters();
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoContrastOutline size={12} className="text-secondary" /> Contrast
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(imageContrast * 100)}%</span>
                        </div>
                        <Form.Range 
                          min={-1.0} 
                          max={1.0} 
                          step={0.05}
                          value={imageContrast}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setImageContrast(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image') {
                                const fabric = require('fabric').fabric;
                                activeObj.filters = (activeObj.filters || []).filter(f => f && f.type !== 'Contrast');
                                if (val !== 0) {
                                  activeObj.filters.push(new fabric.Image.filters.Contrast({ contrast: val }));
                                }
                                activeObj.applyFilters();
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoColorPaletteOutline size={12} className="text-secondary" /> Saturation
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(imageSaturation * 100)}%</span>
                        </div>
                        <Form.Range 
                          min={-1.0} 
                          max={1.0} 
                          step={0.05}
                          value={imageSaturation}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setImageSaturation(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image') {
                                const fabric = require('fabric').fabric;
                                activeObj.filters = (activeObj.filters || []).filter(f => f && f.type !== 'Saturation');
                                if (val !== 0) {
                                  activeObj.filters.push(new fabric.Image.filters.Saturation({ saturation: val }));
                                }
                                activeObj.applyFilters();
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              
    </>
  );

  const ShapeTabContent = () => (
    <>
      
                <div className="d-flex flex-column gap-3 pt-2">                  <div>
                    <span className="small fw-semibold text-secondary d-block mb-2">Insert Geometric Shapes</span>
                    <div className="d-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('circle')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Circle"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('square')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Square"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('triangle')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Triangle"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 22h20L12 2z" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('star')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Star"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('heart')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Heart"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('pentagon')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Pentagon"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 9.27 18.18 21.02 5.82 21.02 2 9.27 12 2" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('hexagon')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Hexagon"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 21 7.2 21 17.8 12 23 3 17.8 3 7.2 12 2" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('octagon')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Octagon"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="8.5 2 15.5 2 22 8.5 22 15.5 15.5 22 8.5 22 2 15.5 2 8.5 8.5 2" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('diamond')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Diamond"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 12 12 22 2 12 12 2" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('arrow')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Arrow"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('cross')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Plus/Cross"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </button>
                      <button 
                        type="button"
                        className="btn-format-tool p-0 d-flex align-items-center justify-content-center" 
                        onClick={() => handleAddShape('ring')}
                        style={{ height: '36px', borderRadius: '6px' }}
                        title="Ring"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /></svg>
                      </button>
                    </div>
                  </div>

                  <hr className="my-1" />

                  {/* Shape Adjustments in a 2-Column Grid */}
                  <div className="d-flex flex-column gap-2">
                    <Row className="g-2 mb-2">
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: '11px' }}>Fill Color</Form.Label>
                          <div className="d-flex align-items-center form-control-premium w-100" style={{ gap: '6px', minHeight: '38px', padding: '4px 8px', position: 'relative', backgroundColor: '#ffffff' }}>
                            <div 
                              style={{ 
                                width: '18px', 
                                height: '18px', 
                                borderRadius: '50%', 
                                backgroundColor: shapeColor, 
                                border: '1px solid #CBD5E1',
                                position: 'relative',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                flexShrink: 0
                              }}
                            >
                              <input
                                type="color"
                                value={shapeColor}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setShapeColor(val);
                                  if (canvas) {
                                    const activeObj = canvas.getActiveObject();
                                    if (activeObj && activeObj.type !== 'i-text' && activeObj.type !== 'text' && activeObj.type !== 'image') {
                                      activeObj.set({ fill: val });
                                      canvas.renderAll();
                                      canvas.fire('object:modified', { target: activeObj });
                                    }
                                  }
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '-5px',
                                  left: '-5px',
                                  width: '28px',
                                  height: '28px',
                                  opacity: 0,
                                  cursor: 'pointer'
                                }}
                              />
                            </div>
                            <input
                              type="text"
                              value={shapeColor}
                              onChange={(e) => {
                                const val = e.target.value;
                                setShapeColor(val);
                                if (canvas) {
                                  const activeObj = canvas.getActiveObject();
                                  if (activeObj && activeObj.type !== 'i-text' && activeObj.type !== 'text' && activeObj.type !== 'image') {
                                    activeObj.set({ fill: val });
                                    canvas.renderAll();
                                    canvas.fire('object:modified', { target: activeObj });
                                  }
                                }
                              }}
                              className="border-0 p-0 text-uppercase fw-semibold text-secondary w-100"
                              style={{ fontSize: '11px', outline: 'none', background: 'transparent' }}
                              placeholder="#FF8525"
                            />
                          </div>
                        </Form.Group>
                      </Col>

                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary mb-1" style={{ fontSize: '11px' }}>Stroke Color</Form.Label>
                          <div 
                            className="d-flex align-items-center form-control-premium w-100" 
                            style={{ 
                              gap: '6px', 
                              minHeight: '38px', 
                              padding: '4px 8px',
                              position: 'relative', 
                              backgroundColor: shapeStrokeWidth === 0 ? '#F1F5F9' : '#ffffff',
                              opacity: shapeStrokeWidth === 0 ? 0.7 : 1
                            }}
                          >
                            <div 
                              style={{ 
                                width: '18px', 
                                height: '18px', 
                                borderRadius: '50%', 
                                backgroundColor: shapeStrokeColor, 
                                border: '1px solid #CBD5E1',
                                position: 'relative',
                                cursor: shapeStrokeWidth === 0 ? 'not-allowed' : 'pointer',
                                overflow: 'hidden',
                                flexShrink: 0
                              }}
                            >
                              <input
                                type="color"
                                value={shapeStrokeColor}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setShapeStrokeColor(val);
                                  if (canvas) {
                                    const activeObj = canvas.getActiveObject();
                                    if (activeObj && activeObj.type !== 'i-text' && activeObj.type !== 'text' && activeObj.type !== 'image') {
                                      activeObj.set({ stroke: val });
                                      canvas.renderAll();
                                      canvas.fire('object:modified', { target: activeObj });
                                    }
                                  }
                                }}
                                disabled={shapeStrokeWidth === 0}
                                style={{
                                  position: 'absolute',
                                  top: '-5px',
                                  left: '-5px',
                                  width: '28px',
                                  height: '28px',
                                  opacity: 0,
                                  cursor: shapeStrokeWidth === 0 ? 'not-allowed' : 'pointer'
                                }}
                              />
                            </div>
                            <input
                              type="text"
                              value={shapeStrokeColor}
                              onChange={(e) => {
                                const val = e.target.value;
                                setShapeStrokeColor(val);
                                if (canvas) {
                                  const activeObj = canvas.getActiveObject();
                                  if (activeObj && activeObj.type !== 'i-text' && activeObj.type !== 'text' && activeObj.type !== 'image') {
                                    activeObj.set({ stroke: val });
                                    canvas.renderAll();
                                    canvas.fire('object:modified', { target: activeObj });
                                  }
                                }
                              }}
                              className="border-0 p-0 text-uppercase fw-semibold text-secondary w-100"
                              style={{ fontSize: '11px', outline: 'none', background: 'transparent' }}
                              placeholder="#FFFFFF"
                              disabled={shapeStrokeWidth === 0}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col xs={6}>
                        <Form.Group>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                              <IoEyeOutline size={12} className="text-secondary" /> Opacity
                            </Form.Label>
                            <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(shapeOpacity * 100)}%</span>
                          </div>
                          <Form.Range 
                            min={0.1} 
                            max={1.0} 
                            step={0.05}
                            value={shapeOpacity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setShapeOpacity(val);
                              if (canvas) {
                                const activeObj = canvas.getActiveObject();
                                if (activeObj && activeObj.type !== 'i-text' && activeObj.type !== 'text' && activeObj.type !== 'image') {
                                  activeObj.set({ opacity: val });
                                  canvas.renderAll();
                                  canvas.fire('object:modified', { target: activeObj });
                                }
                              }
                            }}
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={6}>
                        <Form.Group>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                              <IoResizeOutline size={12} className="text-secondary" /> Scale
                            </Form.Label>
                            <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(shapeScale * 100)}%</span>
                          </div>
                          <Form.Range 
                            min={0.05} 
                            max={2.0} 
                            step={0.05}
                            value={shapeScale}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setShapeScale(val);
                              if (canvas) {
                                const activeObj = canvas.getActiveObject();
                                if (activeObj && activeObj.type !== 'i-text' && activeObj.type !== 'text' && activeObj.type !== 'image') {
                                  activeObj.set({ scaleX: val, scaleY: val });
                                  canvas.renderAll();
                                  canvas.fire('object:modified', { target: activeObj });
                                }
                              }
                            }}
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={6}>
                        <Form.Group>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                              <IoReload size={12} className="text-secondary" /> Rotate
                            </Form.Label>
                            <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{shapeRotation}Â°</span>
                          </div>
                          <Form.Range 
                            min={0} 
                            max={360} 
                            step={1}
                            value={shapeRotation}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setShapeRotation(val);
                              if (canvas) {
                                const activeObj = canvas.getActiveObject();
                                if (activeObj && activeObj.type !== 'i-text' && activeObj.type !== 'text' && activeObj.type !== 'image') {
                                  activeObj.set({ angle: val });
                                  canvas.renderAll();
                                  canvas.fire('object:modified', { target: activeObj });
                                }
                              }
                            }}
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={6}>
                        <Form.Group>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                              <IoSquare size={10} className="text-secondary" /> Stroke
                            </Form.Label>
                            <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{shapeStrokeWidth}px</span>
                          </div>
                          <Form.Range 
                            min={0} 
                            max={20} 
                            step={1}
                            value={shapeStrokeWidth}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setShapeStrokeWidth(val);
                              if (canvas) {
                                const activeObj = canvas.getActiveObject();
                                if (activeObj && activeObj.type !== 'i-text' && activeObj.type !== 'text' && activeObj.type !== 'image') {
                                  activeObj.set({ strokeWidth: val });
                                  canvas.renderAll();
                                  canvas.fire('object:modified', { target: activeObj });
                                }
                              }
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </div>
              
    </>
  );

  const StickerTabContent = () => (
    <>
      
                <div className="d-flex flex-column gap-3 pt-2">
                  <div>
                    <span className="small fw-semibold text-secondary d-block mb-2">Choose Sticker</span>
                    <div className="d-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {stickersList.map((st, idx) => {
                        const stickerUrl = (st.image && (st.image.startsWith('http') ? st.image : `${getBackendUrl()}${st.image}`)) || st.url;
                        return (
                          <div 
                            key={st._id || idx}
                            className="border rounded p-1 text-center"
                            style={{ 
                              cursor: 'pointer', 
                              backgroundColor: '#F8FAFC', 
                              transition: 'all 0.2s',
                              borderRadius: '8px',
                              borderWidth: '1px'
                            }}
                            onClick={() => handleAddSticker(stickerUrl)}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#ff8525';
                              e.currentTarget.style.backgroundColor = 'rgba(255, 133, 37, 0.03)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = '#E2E8F0';
                              e.currentTarget.style.backgroundColor = '#F8FAFC';
                            }}
                            title={st.name}
                          >
                            <img src={stickerUrl} alt={st.name} style={{ width: '100%', height: '40px', objectFit: 'contain' }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <hr className="my-1" />

                  {/* Sticker Adjustments in a 2-Column Grid */}
                  <Row className="g-2">
                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoEyeOutline size={12} className="text-secondary" /> Opacity
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(stickerOpacity * 100)}%</span>
                        </div>
                        <Form.Range 
                          min={0.1} 
                          max={1.0} 
                          step={0.05}
                          value={stickerOpacity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setStickerOpacity(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image' && activeObj.isSticker) {
                                activeObj.set({ opacity: val });
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoResizeOutline size={12} className="text-secondary" /> Scale
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(stickerScale * 100)}%</span>
                        </div>
                        <Form.Range 
                          min={0.05} 
                          max={2.0} 
                          step={0.05}
                          value={stickerScale}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setStickerScale(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image' && activeObj.isSticker) {
                                activeObj.set({ scaleX: val, scaleY: val });
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoReload size={12} className="text-secondary" /> Rotate
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{stickerRotation}Â°</span>
                        </div>
                        <Form.Range 
                          min={0} 
                          max={360} 
                          step={1}
                          value={stickerRotation}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setStickerRotation(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image' && activeObj.isSticker) {
                                activeObj.set({ angle: val });
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoSunnyOutline size={12} className="text-secondary" /> Brightness
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(stickerBrightness * 100)}%</span>
                        </div>
                        <Form.Range 
                          min={-1.0} 
                          max={1.0} 
                          step={0.05}
                          value={stickerBrightness}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setStickerBrightness(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image' && activeObj.isSticker) {
                                const fabric = require('fabric').fabric;
                                activeObj.filters = (activeObj.filters || []).filter(f => f && f.type !== 'Brightness');
                                if (val !== 0) {
                                  activeObj.filters.push(new fabric.Image.filters.Brightness({ brightness: val }));
                                }
                                activeObj.applyFilters();
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoContrastOutline size={12} className="text-secondary" /> Contrast
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(stickerContrast * 100)}%</span>
                        </div>
                        <Form.Range 
                          min={-1.0} 
                          max={1.0} 
                          step={0.05}
                          value={stickerContrast}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setStickerContrast(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image' && activeObj.isSticker) {
                                const fabric = require('fabric').fabric;
                                activeObj.filters = (activeObj.filters || []).filter(f => f && f.type !== 'Contrast');
                                if (val !== 0) {
                                  activeObj.filters.push(new fabric.Image.filters.Contrast({ contrast: val }));
                                }
                                activeObj.applyFilters();
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-semibold text-secondary m-0 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <IoColorPaletteOutline size={12} className="text-secondary" /> Saturation
                          </Form.Label>
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{Math.round(stickerSaturation * 100)}%</span>
                        </div>
                        <Form.Range 
                          min={-1.0} 
                          max={1.0} 
                          step={0.05}
                          value={stickerSaturation}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setStickerSaturation(val);
                            if (canvas) {
                              const activeObj = canvas.getActiveObject();
                              if (activeObj && activeObj.type === 'image' && activeObj.isSticker) {
                                const fabric = require('fabric').fabric;
                                activeObj.filters = (activeObj.filters || []).filter(f => f && f.type !== 'Saturation');
                                if (val !== 0) {
                                  activeObj.filters.push(new fabric.Image.filters.Saturation({ saturation: val }));
                                }
                                activeObj.applyFilters();
                                canvas.renderAll();
                                canvas.fire('object:modified', { target: activeObj });
                              }
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              
    </>
  );

if (isMounted && isMobileView) {
    return (
      <div className="mobile-editor-layout d-flex flex-column animate-fade-in" style={{ height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
        
        {/* Top Navbar */}
        <div className="editor-mobile-header d-flex align-items-center justify-content-between px-3 shadow-sm bg-white" style={{ height: '56px', flexShrink: 0, zIndex: 100 }}>
          <div className="fw-bold text-slate-800" style={{ fontSize: '15px' }}>Design Studio</div>
          <div className="d-flex gap-2">
             <button className="btn btn-sm btn-light border rounded-pill px-3 fw-bold shadow-sm" style={{fontSize: '11px'}} onClick={handleSaveDesign} disabled={isSavingDesign}>
                {isSavingDesign ? 'Saving...' : 'Save'}
             </button>
             <button className="btn btn-sm text-white rounded-pill px-3 fw-bold shadow-sm" style={{background: 'linear-gradient(135deg, #ff8525, #e53e3e)', fontSize: '11px'}} onClick={handleAddToCartWithDesign}>
                Add to Cart
             </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="editor-mobile-canvas d-flex flex-column align-items-center justify-content-center position-relative flex-grow-1" style={{ overflow: 'hidden' }}>
            <div className="w-100 d-flex justify-content-center pt-2 pb-2">
                <div style={{ transform: `scale(${Math.min(mobileScale * 1.25, 0.9)})`, transformOrigin: 'top center' }}>
                  <div 
                    className="position-relative shadow rounded-4 overflow-hidden canvas-frame-box" 
                    style={{
                      width: '380px',
                      height: '470px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div className="position-absolute w-100 h-100 top-0 start-0" style={{ zIndex: 1 }}>
                      <Tshirt3DViewer 
                        tshirtColor={tshirtColor}
                        tshirtView={tshirtView}
                        frontFabricCanvas={frontCanvas}
                        backFabricCanvas={backCanvas}
                        visible={true}
                        interactive={displayMode === '3d'}
                        hideDecals={displayMode === '2d'}
                        garmentType={garmentType}
                      />
                    </div>
                    <div 
                      className="position-absolute w-100 h-100 top-0 start-0" 
                      style={{ 
                        zIndex: 2,
                        display: displayMode === '2d' ? 'block' : 'none',
                        pointerEvents: 'auto'
                      }}
                    >
                      <div className="position-absolute border border-dashed border-danger border-opacity-50" style={{
                        width: '242px',
                        height: '442px',
                        top: '25px',
                        left: 'calc(50% - 121px)',
                        zIndex: 3,
                        pointerEvents: 'none'
                      }}>
                        <span className="position-absolute badge bg-danger opacity-75" style={{ fontSize: '8px', top: '4px', left: '4px' }}>Print Area</span>
                      </div>
                      <div className="position-absolute" style={{
                        top: '25px',
                        left: 'calc(50% - 121px)',
                        zIndex: 4,
                        display: tshirtView === 'front' ? 'block' : 'none'
                      }}>
                        <canvas ref={frontCanvasRef} />
                      </div>
                      <div className="position-absolute" style={{
                        top: '25px',
                        left: 'calc(50% - 121px)',
                        zIndex: 4,
                        display: tshirtView === 'back' ? 'block' : 'none'
                      }}>
                        <canvas ref={backCanvasRef} />
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Quick Canvas View Toggles Overlay */}
            <div className="position-absolute" style={{ bottom: '15px', right: '15px', zIndex: 50 }}>
                <div className="d-flex flex-column gap-2 bg-white p-1 rounded-pill shadow border">
                    <button onClick={() => setTshirtView('front')} className={`btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center ${tshirtView === 'front' ? 'bg-dark text-white' : 'bg-transparent text-secondary'}`} style={{ width: '32px', height: '32px' }} title="Front View">
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>F</span>
                    </button>
                    <button onClick={() => setTshirtView('back')} className={`btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center ${tshirtView === 'back' ? 'bg-dark text-white' : 'bg-transparent text-secondary'}`} style={{ width: '32px', height: '32px' }} title="Back View">
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>B</span>
                    </button>
                    <div className="border-bottom mx-1"></div>
                    <button onClick={() => setDisplayMode(displayMode === '2d' ? '3d' : '2d')} className="btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center bg-transparent text-primary" style={{ width: '32px', height: '32px' }} title="Toggle 2D/3D">
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{displayMode === '2d' ? '3D' : '2D'}</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Bottom Toolbar & Drawer Container */}
        <div className="position-relative" style={{ zIndex: 200 }}>
            {/* Sliding Drawer */}
            <div 
                className="bg-white border-top shadow-lg"
                style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    width: '100%',
                    maxHeight: '40vh',
                    overflowY: 'auto',
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                    transform: mobileActiveTab ? 'translateY(0)' : 'translateY(10px)',
                    opacity: mobileActiveTab ? 1 : 0,
                    pointerEvents: mobileActiveTab ? 'auto' : 'none',
                    paddingBottom: '10px'
                }}
            >
                {mobileActiveTab && (
                    <div className="p-3 pb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="m-0 fw-extrabold text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '13px' }}>
                                {mobileActiveTab === 'color' && 'Garment'}
                                {mobileActiveTab === 'text' && 'Add Text'}
                                {mobileActiveTab === 'sticker' && 'Stickers'}
                                {mobileActiveTab === 'shape' && 'Shapes'}
                                {mobileActiveTab === 'upload' && 'Upload Image'}
                                {mobileActiveTab === 'layers' && 'Layers'}
                            </h6>
                            <button className="btn-close" style={{ fontSize: '10px' }} onClick={() => setMobileActiveTab(null)}></button>
                        </div>
                        <div className="custom-drawer-content-scroll" style={{ overflowX: 'hidden' }}>
                            {mobileActiveTab === 'color' && (
                                <div className="d-flex flex-column gap-3">
                                  <div>
                                    <label className="fw-bold mb-2 small text-secondary text-uppercase" style={{ letterSpacing: '1px', fontSize: '10px' }}>Garment Type</label>
                                    <div className="d-flex gap-2">
                                      <button type="button" onClick={() => setGarmentType('tshirt')} className={`flex-fill border py-2 rounded-3 fw-bold ${garmentType === 'tshirt' ? 'bg-dark text-white shadow-sm' : 'bg-light text-secondary border-light'}`} style={{ fontSize: '12px' }}>T-Shirt</button>
                                      <button type="button" onClick={() => setGarmentType('polo')} className={`flex-fill border py-2 rounded-3 fw-bold ${garmentType === 'polo' ? 'bg-dark text-white shadow-sm' : 'bg-light text-secondary border-light'}`} style={{ fontSize: '12px' }}>Polo</button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="fw-bold mb-2 small text-secondary text-uppercase" style={{ letterSpacing: '1px', fontSize: '10px' }}>Fabric Color</label>
                                    <div className="d-flex flex-wrap gap-2">
                                      {displayColors.map((color) => {
                                        const isSelected = tshirtColor.toLowerCase() === color.hex.toLowerCase();
                                        const imageUrl = color.image ? (color.image.startsWith('http') ? color.image : `${getBackendUrl()}${color.image}`) : null;
                                        return (
                                          <button key={color.name} type="button" title={color.name} onClick={() => { setTshirtColor(color.hex); if (color.sizes && color.sizes.length > 0 && !color.sizes.includes(selectedSize)) setSelectedSize(color.sizes[0]); }} style={{ width:'40px', height:'40px', borderRadius:'10px', border: isSelected ? '2px solid #ff8525' : '1px solid #e2e8f0', backgroundColor: imageUrl ? '#f8fafc' : color.hex, cursor:'pointer', padding:0, overflow:'hidden', transform: isSelected ? 'scale(1.1)' : 'scale(1)', transition:'all 0.2s ease', boxShadow: isSelected ? '0 4px 8px rgba(0,0,0,0.15)' : 'none' }}>
                                            {imageUrl ? <img src={imageUrl} alt={color.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', backgroundColor: color.hex }} />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="fw-bold mb-2 small text-secondary text-uppercase" style={{ letterSpacing: '1px', fontSize: '10px' }}>Size</label>
                                    <div className="d-flex flex-wrap gap-2">
                                      {(() => {
                                        const currentColorObj = displayColors.find(c => c.hex.toLowerCase() === tshirtColor.toLowerCase()) || displayColors[0] || { sizes: ['S','M','L','XL','XXL'] };
                                        const availableSizes = currentColorObj.sizes || ['S','M','L','XL','XXL'];
                                        return availableSizes.map((s) => (
                                          <button key={s} type="button" onClick={() => setSelectedSize(s)} className={`btn fw-bold px-3 py-1 ${selectedSize === s ? 'bg-dark text-white shadow-sm' : 'bg-light text-secondary'}`} style={{ borderRadius: '8px', fontSize: '12px' }}>{s}</button>
                                        ));
                                      })()}
                                    </div>
                                  </div>
                                </div>
                            )}
                            {mobileActiveTab === 'text' && <TextTabContent />}
                            {mobileActiveTab === 'sticker' && <StickerTabContent />}
                            {mobileActiveTab === 'shape' && <ShapeTabContent />}
                            {mobileActiveTab === 'upload' && <ImageTabContent />}
                            {mobileActiveTab === 'layers' && (
                                <div className="d-flex flex-column gap-2">
                                    {layersList.length === 0 ? (
                                      <div className="text-muted small text-center py-3">No layers added yet.</div>
                                    ) : (
                                      layersList.map((layer, index) => {
                                          const canvasIdx = layersList.length - 1 - index;
                                          const isSelected = activeLayerId === layer.id;
                                          return (
                                            <div key={index} onClick={() => selectCanvasLayer(canvasIdx)} className="d-flex align-items-center justify-content-between p-2 rounded-3 border mb-1" style={{ backgroundColor: isSelected ? 'rgba(255,133,37,0.05)' : '#fff', borderColor: isSelected ? '#ff8525' : '#e2e8f0' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    {layer.type === 'text' ? <IoText size={14} className="text-secondary" /> : layer.type === 'image' ? <IoImage size={14} className="text-secondary" /> : <IoSquare size={14} className="text-secondary" />}
                                                    <span className="fw-semibold text-truncate" style={{ fontSize: '12px', maxWidth: '150px' }}>{layer.name}</span>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button type="button" className="btn btn-sm p-1 border-0" onClick={(e) => { e.stopPropagation(); toggleLayerLock(canvasIdx); }}>{layer.locked ? <FiLock size={12} color="#ff8525" /> : <FiUnlock size={12} color="#94A3B8" />}</button>
                                                    <button type="button" className="btn btn-sm p-1 border-0" onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(canvasIdx); }}>{layer.visible ? <FiEye size={13} color="#ff8525" /> : <FiEyeOff size={13} color="#94A3B8" />}</button>
                                                    <button type="button" className="btn btn-sm p-1 border-0" onClick={(e) => { e.stopPropagation(); handleLayerOrder('delete'); }}><IoTrash size={13} color="#dc2626" /></button>
                                                </div>
                                            </div>
                                          );
                                      })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Navbar (Tool selector) */}
            <div className="bg-white px-2 py-2 d-flex overflow-auto hide-scrollbar shadow-lg align-items-center" style={{ whiteSpace: 'nowrap', borderTop: '1px solid #E2E8F0' }}>
                {[
                  { id: 'color', icon: <IoColorPaletteOutline size={20} />, label: 'Garment' },
                  { id: 'text', icon: <IoText size={20} />, label: 'Text' },
                  { id: 'upload', icon: <IoImage size={20} />, label: 'Upload' },
                  { id: 'shape', icon: <IoShapesOutline size={20} />, label: 'Shape' },
                  { id: 'sticker', icon: <IoHappyOutline size={20} />, label: 'Sticker' },
                  { id: 'layers', icon: <IoLayersOutline size={20} />, label: 'Layers' },
                ].map(tool => (
                    <button 
                        key={tool.id} 
                        onClick={() => setMobileActiveTab(mobileActiveTab === tool.id ? null : tool.id)} 
                        className="btn border-0 d-flex flex-column align-items-center justify-content-center position-relative flex-shrink-0"
                        style={{ width: '65px', padding: '6px 0', color: mobileActiveTab === tool.id ? '#ff8525' : '#64748b' }}
                    >
                        <div style={{ transform: mobileActiveTab === tool.id ? 'translateY(-2px)' : 'none', transition: 'transform 0.2s' }}>
                           {tool.icon}
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: mobileActiveTab === tool.id ? 'bold' : 'normal', marginTop: '4px' }}>{tool.label}</span>
                        {mobileActiveTab === tool.id && <div className="position-absolute bottom-0 start-50 translate-middle-x" style={{ width: '20px', height: '3px', backgroundColor: '#ff8525', borderRadius: '3px' }} />}
                    </button>
                ))}
            </div>
        </div>

      </div>
    );
  }

  return (
    <Container suppressHydrationWarning className={`py-5${isMounted && mobileDrawerOpen ? ' drawer-open' : ''}`}>
      <Row className="gy-4">
        
        {/* LEFT TOOL PANEL */}
        <Col lg={3} className="d-none d-lg-block">
          <div className="glass-panel p-3 bg-white h-100 d-flex flex-column gap-3">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
              <IoMove /> Tools Panel
            </h5>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 custom-design-tabs">
              
              {/* Text Layer Tab */}
              
                <Tab eventKey="text" title="Text"><TextTabContent /></Tab>
                <Tab eventKey="image" title="Image"><ImageTabContent /></Tab>
                <Tab eventKey="shape" title="Shape"><ShapeTabContent /></Tab>
                <Tab eventKey="sticker" title="Sticker"><StickerTabContent /></Tab>

            </Tabs>

            <hr className="my-1" />

            {/* Canvas layer management */}
            <div className="d-flex flex-column gap-2 mt-1" ref={layerPanelRef}>
              <div className="d-flex align-items-center justify-content-between">
                <span className="small fw-semibold text-secondary">Layer Control</span>
                <div className="d-flex gap-1">
                  <button 
                    type="button"
                    className="btn-format-tool"
                    onClick={() => handleLayerOrder('duplicate')}
                    title="Duplicate Layer"
                  >
                    <IoCopy size={15} />
                  </button>
                  <button 
                    type="button"
                    className="btn-format-tool"
                    style={{ color: '#dc2626' }}
                    onClick={() => handleLayerOrder('delete')}
                    title="Delete Layer"
                  >
                    <IoTrash size={15} />
                  </button>
                </div>
              </div>

              {/* Floating Dropdown Toggle Wrapper */}
              <div className="position-relative w-100">
                <button
                  ref={toggleButtonRef}
                  type="button"
                  className={`btn-format-tool w-100 justify-content-between px-3 ${showLayerPanel ? 'active' : ''}`}
                  style={{ height: '36px', fontSize: '13px', borderRadius: '6px' }}
                  onClick={() => setShowLayerPanel(!showLayerPanel)}
                  title="Manage Layers"
                >
                  <span className="d-flex align-items-center gap-2">
                    Manage Layers ({layersList.length})
                  </span>
                  <IoChevronDown size={14} style={{ transform: dropdownDirection === 'up' && showLayerPanel ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {/* Floating Layer Panel Card Dropdown */}
                {showLayerPanel && (
                  <div 
                    className="position-absolute shadow-lg rounded-3 border bg-white p-2"
                    style={{ 
                      top: dropdownDirection === 'down' ? '40px' : 'auto',
                      bottom: dropdownDirection === 'up' ? '40px' : 'auto',
                      left: 0, 
                      zIndex: 100, 
                      width: '100%', 
                      maxHeight: '280px',
                      overflowY: 'auto',
                      boxShadow: dropdownDirection === 'down'
                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important'
                        : '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.1) !important'
                    }}
                  >
                    {layersList.length === 0 ? (
                      <div className="text-muted small text-center py-3">No layers added yet.</div>
                    ) : (
                      <div className="d-flex flex-column gap-1">
                        {layersList.map((layer, index) => {
                          const canvasIdx = layersList.length - 1 - index;
                          const isSelected = activeLayerId === layer.id;
                          
                          return (
                            <div
                              key={index}
                              draggable
                              onDragStart={(e) => handleDragStart(e, canvasIdx)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, canvasIdx)}
                              onClick={() => selectCanvasLayer(canvasIdx)}
                              className="d-flex align-items-center justify-content-between p-2 rounded-2"
                              style={{
                                backgroundColor: isSelected ? 'rgba(255, 133, 37, 0.1)' : 'transparent',
                                border: isSelected ? '1px solid rgba(255, 133, 37, 0.3)' : '1px solid transparent',
                                color: '#334155',
                                cursor: 'grab',
                                transition: 'all 0.15s ease',
                                userSelect: 'none',
                                WebkitUserSelect: 'none'
                              }}
                            >
                              <div className="d-flex align-items-center gap-2 overflow-hidden" style={{ flex: 1 }}>
                                {/* Drag Indicator */}
                                <span className="text-muted" style={{ fontSize: '10px', cursor: 'grab' }}>â˜°</span>
                                
                                {/* Layer Type Icon */}
                                {layer.type === 'text' ? (
                                  <IoText size={13} className="text-secondary" style={{ flexShrink: 0 }} />
                                ) : layer.type === 'image' ? (
                                  <IoImage size={13} className="text-secondary" style={{ flexShrink: 0 }} />
                                ) : (
                                  <IoSquare size={13} className="text-secondary" style={{ flexShrink: 0 }} />
                                )}
                                
                                {/* Layer Name */}
                                <span 
                                  className="text-truncate fw-semibold" 
                                  style={{ fontSize: '11px', color: isSelected ? '#ff8525' : '#334155' }}
                                >
                                  {layer.name}
                                </span>
                              </div>

                              {/* Toggle Visibility & Lock */}
                              <div className="d-flex align-items-center gap-1" style={{ flexShrink: 0 }}>
                                {/* Lock Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLayerLock(canvasIdx);
                                  }}
                                  className="border-0 bg-transparent p-1 d-flex align-items-center justify-content-center"
                                  style={{ 
                                    color: layer.locked ? '#ff8525' : '#94A3B8', 
                                    cursor: 'pointer'
                                  }}
                                  title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                                >
                                  {layer.locked ? <FiLock size={12} /> : <FiUnlock size={12} />}
                                </button>

                                {/* Visibility Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLayerVisibility(canvasIdx);
                                  }}
                                  className="border-0 bg-transparent p-1 d-flex align-items-center justify-content-center"
                                  style={{ 
                                    color: layer.visible ? '#ff8525' : '#94A3B8', 
                                    cursor: 'pointer'
                                  }}
                                  title={layer.visible ? "Hide Layer" : "Show Layer"}
                                >
                                  {layer.visible ? <FiEye size={13} /> : <FiEyeOff size={13} />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </Col>

        {/* CENTER INTERACTIVE T-SHIRT CANVAS */}
        <Col lg={6} className="col-12 text-center sticky-tshirt-col">
          <div className="d-flex flex-column align-items-center justify-content-center relative" style={{ minHeight: '520px' }}>
            


            {/* Unified T-Shirt 3D/2D Viewer Frame */}
            <div 
              className="position-relative shadow rounded-4 overflow-hidden canvas-frame-box" 
              style={{
                width: '100%',
                margin: '0 auto',
                height: isMobileView ? '100vh' : '500px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                transition: 'all 0.3s ease'
              }}
            >
              
              {/* Scale Fitting Wrapper for mobile */}
              <div 
                className={isMobileView ? "position-absolute start-50 top-50 translate-middle" : "position-absolute w-100 h-100 top-0 start-0"}
                style={isMobileView ? {
                  width: '380px',
                  height: '500px',
                  transform: `scale(${mobileScale})`,
                  transformOrigin: 'center center',
                  pointerEvents: 'auto'
                } : {}}
              >
                
                {/* 3D Model Base Layer (Always visible, rotates only in 3D mode) */}
                <div className="position-absolute w-100 h-100 top-0 start-0" style={{ zIndex: 1 }}>
                  <Tshirt3DViewer 
                    tshirtColor={tshirtColor}
                    tshirtView={tshirtView}
                    frontFabricCanvas={frontCanvas}
                    backFabricCanvas={backCanvas}
                    visible={true}
                    interactive={displayMode === '3d'}
                    hideDecals={displayMode === '2d'}
                    garmentType={garmentType}
                  />
                </div>

                {/* 2D Interactive Design Layer (Only overlays in 2D mode, transparent background) */}
                <div 
                  className="position-absolute w-100 h-100 top-0 start-0" 
                  style={{ 
                    zIndex: 2,
                    display: displayMode === '2d' ? 'block' : 'none',
                    pointerEvents: 'auto'
                  }}
                >
                  {/* Printable chest grid bounds marker */}
                  <div className="position-absolute border border-dashed border-danger border-opacity-50" style={{
                    width: '242px',
                    height: '442px',
                    top: '25px',
                    left: 'calc(50% - 121px)',
                    zIndex: 3,
                    pointerEvents: 'none'
                  }}>
                    <span className="position-absolute badge bg-danger opacity-75" style={{ fontSize: '8px', top: '4px', left: '4px' }}>Print Area</span>
                  </div>

                  {/* Absolute Canvas overlay wrapper for Front */}
                  <div className="position-absolute" style={{
                    top: '25px',
                    left: 'calc(50% - 121px)',
                    zIndex: 4,
                    display: tshirtView === 'front' ? 'block' : 'none'
                  }}>
                    <canvas ref={frontCanvasRef} />
                  </div>

                  {/* Absolute Canvas overlay wrapper for Back */}
                  <div className="position-absolute" style={{
                    top: '25px',
                    left: 'calc(50% - 121px)',
                    zIndex: 4,
                    display: tshirtView === 'back' ? 'block' : 'none'
                  }}>
                    <canvas ref={backCanvasRef} />
                  </div>
                </div>

              </div>

            </div>

            <small className="text-muted d-none d-lg-block mt-3">Select elements directly on shirt mock to scale, rotate, or edit text.</small>



          </div>
        </Col>

        {/* RIGHT CONTROL PANEL */}
        <Col lg={3} className="d-none d-lg-block">
          <div className="d-flex flex-column gap-3 h-100" style={{ position: 'sticky', top: '80px' }}>
            <div style={{
              background: '#f1f5f9',
              borderRadius: '16px', padding: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              border: '1px solid #e2e8f0'
            }}>

              {/* Garment Type Selector */}
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>👕 Garment Type</p>
              <div className="d-flex gap-1 mb-3" style={{ background: '#e2e8f0', borderRadius: '10px', padding: '4px' }}>
                <button
                  onClick={() => setGarmentType('tshirt')}
                  style={{
                    flex: 1, border: 'none', borderRadius: '7px', padding: '7px 0',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    background: garmentType === 'tshirt' ? 'linear-gradient(135deg,#ff8525,#e53e3e)' : 'transparent',
                    color: garmentType === 'tshirt' ? '#fff' : '#64748b',
                    transition: 'all 0.25s ease',
                    boxShadow: garmentType === 'tshirt' ? '0 2px 8px rgba(229,62,62,0.3)' : 'none'
                  }}
                >👕 T-Shirt</button>
                <button
                  onClick={() => setGarmentType('polo')}
                  style={{
                    flex: 1, border: 'none', borderRadius: '7px', padding: '7px 0',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    background: garmentType === 'polo' ? 'linear-gradient(135deg,#ff8525,#e53e3e)' : 'transparent',
                    color: garmentType === 'polo' ? '#fff' : '#64748b',
                    transition: 'all 0.25s ease',
                    boxShadow: garmentType === 'polo' ? '0 2px 8px rgba(229,62,62,0.3)' : 'none'
                  }}
                >🎽 Polo</button>
              </div>

              {/* 2D / 3D Toggle */}
              <div className="d-flex gap-1 mb-2" style={{ background: '#e2e8f0', borderRadius: '10px', padding: '4px' }}>
                <button onClick={() => setDisplayMode('2d')} style={{ flex:1, border:'none', borderRadius:'7px', padding:'7px 0', fontSize:'12px', fontWeight:700, cursor:'pointer', background: displayMode==='2d' ? '#ffffff' : 'transparent', color: displayMode==='2d' ? '#0f172a' : '#64748b', transition:'all 0.25s ease', boxShadow: displayMode==='2d' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>✏️ Editor</button>
                <button onClick={() => setDisplayMode('3d')} style={{ flex:1, border:'none', borderRadius:'7px', padding:'7px 0', fontSize:'12px', fontWeight:700, cursor:'pointer', background: displayMode==='3d' ? 'linear-gradient(135deg,#ff8525,#e53e3e)' : 'transparent', color: displayMode==='3d' ? '#fff' : '#64748b', transition:'all 0.25s ease', boxShadow: displayMode==='3d' ? '0 2px 10px rgba(255,133,37,0.4)' : 'none' }}>🔮 Preview</button>
              </div>

              <div className="d-flex gap-1" style={{ background: '#e2e8f0', borderRadius: '10px', padding: '4px' }}>
                <button onClick={() => setTshirtView('front')} style={{ flex:1, border:'none', borderRadius:'7px', padding:'6px 0', fontSize:'11px', fontWeight:600, cursor:'pointer', background: tshirtView==='front' ? '#ffffff' : 'transparent', color: tshirtView==='front' ? '#0f172a' : '#64748b', transition:'all 0.25s ease', boxShadow: tshirtView==='front' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>👕 Front View</button>
                <button onClick={() => setTshirtView('back')} style={{ flex:1, border:'none', borderRadius:'7px', padding:'6px 0', fontSize:'11px', fontWeight:600, cursor:'pointer', background: tshirtView==='back' ? '#ffffff' : 'transparent', color: tshirtView==='back' ? '#0f172a' : '#64748b', transition:'all 0.25s ease', boxShadow: tshirtView==='back' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>🔄 Back View</button>
              </div>
            </div>
            <div style={{ background:'#ffffff', borderRadius:'16px', border:'1px solid #e8ecf0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ background:'linear-gradient(135deg,#ff8525 0%,#e53e3e 100%)', padding:'12px 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                <IoSave style={{ color:'#fff', fontSize:'15px' }} />
                <span style={{ color:'#fff', fontWeight:700, fontSize:'13px', letterSpacing:'0.3px' }}>Configure & Export</span>
              </div>
              <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'16px' }}>
                <div>
                  <p style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>🎨 Fabric Color</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                    {displayColors.map((color) => {
                      const isSelected = tshirtColor.toLowerCase() === color.hex.toLowerCase();
                      const imageUrl = color.image ? (color.image.startsWith('http') ? color.image : `${getBackendUrl()}${color.image}`) : null;
                      return (
                        <button key={color.name} type="button" title={`${color.name} (${color.hex})`}
                          onClick={() => { setTshirtColor(color.hex); if (color.sizes && color.sizes.length > 0 && !color.sizes.includes(selectedSize)) setSelectedSize(color.sizes[0]); }}
                          style={{ width:'38px', height:'38px', borderRadius:'10px', border: isSelected ? '2.5px solid #ff8525' : '2px solid #e2e8f0', outline: isSelected ? '3px solid rgba(255,133,37,0.2)' : 'none', outlineOffset:'1px', backgroundColor: imageUrl ? '#f8fafc' : color.hex, cursor:'pointer', padding:0, overflow:'hidden', transform: isSelected ? 'scale(1.12)' : 'scale(1)', transition:'all 0.2s ease', boxShadow: isSelected ? '0 4px 12px rgba(255,133,37,0.35)' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                          {imageUrl ? <img src={imageUrl} alt={color.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', backgroundColor: color.hex }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,#e2e8f0,transparent)' }} />
                <div>
                  <p style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>📐 Select Size</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {(() => {
                      const currentColorObj = displayColors.find(c => c.hex.toLowerCase() === tshirtColor.toLowerCase()) || displayColors[0] || { sizes: ['S','M','L','XL','XXL'] };
                      const availableSizes = currentColorObj.sizes || ['S','M','L','XL','XXL'];
                      return availableSizes.map((s) => (
                        <button key={s} onClick={() => setSelectedSize(s)} style={{ minWidth:'36px', height:'36px', borderRadius:'9px', border: selectedSize===s ? 'none' : '1.5px solid #e2e8f0', background: selectedSize===s ? 'linear-gradient(135deg,#ff8525,#e53e3e)' : '#f8fafc', color: selectedSize===s ? '#fff' : '#64748b', fontWeight:700, fontSize:'12px', cursor:'pointer', transition:'all 0.2s ease', padding:'0 8px', boxShadow: selectedSize===s ? '0 4px 12px rgba(229,62,62,0.3)' : 'none', transform: selectedSize===s ? 'scale(1.05)' : 'scale(1)' }}>{s}</button>
                      ));
                    })()}
                  </div>
                </div>
                <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,#e2e8f0,transparent)' }} />
                {(() => {
                  const currentColorObj = displayColors.find(c => c.hex.toLowerCase() === tshirtColor.toLowerCase()) || displayColors[0] || { price:1100, discountPrice:0 };
                  const hasDiscount = currentColorObj.discountPrice > 0 && currentColorObj.discountPrice < currentColorObj.price;
                  const basePrice = hasDiscount ? currentColorObj.discountPrice : (currentColorObj.price || 1100);
                  const textCharges = textLinesCount * textPrice;
                  const stickerCharges = stickersCount * stickerPrice;
                  const imageCharges = imagesCount * imagePrice;
                  const shapeCharges = shapesCount * shapePrice;
                  const totalCombinedPrice = basePrice + textCharges + stickerCharges + imageCharges + shapeCharges;
                  return (
                    <div suppressHydrationWarning>
                      <p style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>💰 Price Breakdown</p>
                      <div style={{ background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px' }}>
                          <span style={{ fontSize:'12px', color:'#64748b' }}>Base Fabric</span>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            {hasDiscount && <span style={{ fontSize:'11px', color:'#94a3b8', textDecoration:'line-through' }}>৳{currentColorObj.price}</span>}
                            <span style={{ fontSize:'13px', fontWeight:700, color:'#0f172a' }}>৳{basePrice}</span>
                          </div>
                        </div>
                        {textCharges > 0 && <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 14px', borderTop:'1px solid #e2e8f0' }}><span style={{ fontSize:'12px', color:'#64748b' }}>✏️ Text ({textLinesCount} lines)</span><span style={{ fontSize:'12px', fontWeight:600, color:'#475569' }}>+৳{textCharges}</span></div>}
                        {stickerCharges > 0 && <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 14px', borderTop:'1px solid #e2e8f0' }}><span style={{ fontSize:'12px', color:'#64748b' }}>🌟 Stickers ({stickersCount})</span><span style={{ fontSize:'12px', fontWeight:600, color:'#475569' }}>+৳{stickerCharges}</span></div>}
                        {imageCharges > 0 && <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 14px', borderTop:'1px solid #e2e8f0' }}><span style={{ fontSize:'12px', color:'#64748b' }}>🖼️ Images ({imagesCount})</span><span style={{ fontSize:'12px', fontWeight:600, color:'#475569' }}>+৳{imageCharges}</span></div>}
                        {shapeCharges > 0 && <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 14px', borderTop:'1px solid #e2e8f0' }}><span style={{ fontSize:'12px', color:'#64748b' }}>⬛ Shapes ({shapesCount})</span><span style={{ fontSize:'12px', fontWeight:600, color:'#475569' }}>+৳{shapeCharges}</span></div>}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderTop:'2px solid #e2e8f0', background:'linear-gradient(135deg,rgba(255,133,37,0.05),rgba(229,62,62,0.05))' }}>
                          <span style={{ fontSize:'13px', fontWeight:700, color:'#0f172a' }}>Total</span>
                          <span style={{ fontSize:'22px', fontWeight:800, background:'linear-gradient(135deg,#ff8525,#e53e3e)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>৳{totalCombinedPrice}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={handleOpenPreview} onMouseOver={e => { e.currentTarget.style.borderColor='#ff8525'; e.currentTarget.style.color='#ff8525'; }} onMouseOut={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#475569'; }} style={{ flex: 1, border:'1.5px solid #e2e8f0', borderRadius:'12px', padding:'8px 10px', background:'#fff', color:'#475569', fontWeight:600, fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', transition:'all 0.2s ease', whiteSpace: 'nowrap' }}><IoPushOutline style={{ fontSize:'15px' }} /> Full Preview</button>
                <button onClick={handleSaveDesign} disabled={isSavingDesign} onMouseOver={e => { if (!isSavingDesign) { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.color='#6366f1'; } }} onMouseOut={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#475569'; }} style={{ flex: 1, border:'1.5px solid #e2e8f0', borderRadius:'12px', padding:'8px 10px', background:'#fff', color:'#475569', fontWeight:600, fontSize:'13px', cursor: isSavingDesign ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', transition:'all 0.2s ease', opacity: isSavingDesign ? 0.7 : 1, whiteSpace: 'nowrap' }}><IoSave style={{ fontSize:'15px' }} /> {isSavingDesign ? 'Saving...' : 'Save Design'}</button>
              </div>
              <button onClick={handleAddToCartWithDesign} onMouseOver={e => { e.currentTarget.style.boxShadow='0 8px 28px rgba(229,62,62,0.5)'; e.currentTarget.style.transform='translateY(-1px)'; }} onMouseOut={e => { e.currentTarget.style.boxShadow='0 6px 20px rgba(229,62,62,0.35)'; e.currentTarget.style.transform='translateY(0)'; }} style={{ border:'none', borderRadius:'12px', padding:'14px 16px', background:'linear-gradient(135deg,#ff8525 0%,#e53e3e 100%)', color:'#fff', fontWeight:700, fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 6px 20px rgba(229,62,62,0.35)', transition:'all 0.2s ease', letterSpacing:'0.3px' }}><IoCart style={{ fontSize:'18px' }} /> Add to Cart</button>
            </div>
          </div>
        </Col>


      </Row>

      {/* Mobile UI — only rendered client-side to prevent SSR hydration mismatch */}
      {isMounted && (
      <>

      {/* Mobile Top Floating Bar */}
      <div className="mobile-top-bar d-lg-none">
        <div className="d-flex align-items-center gap-1 bg-light p-1 rounded-3">
          <button 
            type="button"
            className={`btn btn-xs py-1 px-2 fw-bold border-0 ${garmentType === 'tshirt' ? 'bg-danger text-white shadow-sm' : 'text-secondary bg-transparent'}`}
            style={{ fontSize: '10.5px', borderRadius: '5px' }}
            onClick={() => setGarmentType('tshirt')}
          >👕 Tee</button>
          <button 
            type="button"
            className={`btn btn-xs py-1 px-2 fw-bold border-0 ${garmentType === 'polo' ? 'bg-danger text-white shadow-sm' : 'text-secondary bg-transparent'}`}
            style={{ fontSize: '10.5px', borderRadius: '5px' }}
            onClick={() => setGarmentType('polo')}
          >🎽 Polo</button>
        </div>

        <div className="d-flex align-items-center gap-1 bg-light p-1 rounded-3">
          <button 
            type="button"
            className={`btn btn-xs py-1 px-2 fw-bold border-0 ${tshirtView === 'front' ? 'bg-white text-dark shadow-sm' : 'text-secondary bg-transparent'}`}
            style={{ fontSize: '10.5px', borderRadius: '5px' }}
            onClick={() => setTshirtView('front')}
          >Front</button>
          <button 
            type="button"
            className={`btn btn-xs py-1 px-2 fw-bold border-0 ${tshirtView === 'back' ? 'bg-white text-dark shadow-sm' : 'text-secondary bg-transparent'}`}
            style={{ fontSize: '10.5px', borderRadius: '5px' }}
            onClick={() => setTshirtView('back')}
          >Back</button>
        </div>

        <div className="d-flex align-items-center gap-1 bg-light p-1 rounded-3">
          <button 
            type="button"
            className={`btn btn-xs py-1 px-2 fw-bold border-0 ${displayMode === '2d' ? 'bg-white text-dark shadow-sm' : 'text-secondary bg-transparent'}`}
            style={{ fontSize: '10.5px', borderRadius: '5px' }}
            onClick={() => setDisplayMode('2d')}
          >2D</button>
          <button 
            type="button"
            className={`btn btn-xs py-1 px-2 fw-bold border-0 ${displayMode === '3d' ? 'bg-danger text-white shadow-sm' : 'text-secondary bg-transparent'}`}
            style={{ fontSize: '10.5px', borderRadius: '5px' }}
            onClick={() => setDisplayMode('3d')}
          >3D</button>
        </div>
      </div>

      {/* Mobile controls are now unified in the tab panel below the shirt box */}

      </> /* end isMounted mobile UI */
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-slate-800">3D Real-time Inspection Studio</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 bg-light rounded-bottom overflow-hidden position-relative" style={{ height: '520px' }}>
          <Tshirt3DViewer 
            tshirtColor={tshirtColor}
            tshirtView={tshirtView}
            frontFabricCanvas={frontCanvas}
            backFabricCanvas={backCanvas}
            visible={showPreview}
            interactive={true}
            garmentType={garmentType}
          />
          {/* Interactive hints watermark overlay */}
          <div className="position-absolute bottom-0 start-50 translate-middle-x pb-3 text-center pointer-events-none" style={{ zIndex: 10 }}>
            <span className="badge bg-dark bg-opacity-75 px-3 py-2 rounded-pill fw-semibold" style={{ fontSize: '11px' }}>
              ðŸ–±ï¸  Drag to rotate T-Shirt â€¢ ðŸ”  Scroll to zoom in/out
            </span>
          </div>
        </Modal.Body>
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
        
        @media (max-width: 991px) {
          /* Hide corporate footer on mobile on design page */
          footer.site-footer {
            display: none !important;
          }
          
          /* Add bottom padding to container to prevent nav overlay overlap */
          .py-5.container {
            padding-bottom: 120px !important;
            padding-top: 10px !important;
          }
          
          /* Mobile Top Float Controls */
          .mobile-top-bar {
            position: fixed;
            top: 76px;
            left: 16px;
            right: 16px;
            z-index: 999;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: 14px;
            padding: 8px 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          }
          
          /* Canvas Adjustments */
          .sticky-tshirt-col {
            position: relative !important;
            top: 0 !important;
            margin-top: 45px !important;
            transition: margin-top 0.3s ease;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          /* Canvas wrapper & inner frame sizing on mobile */
          .sticky-tshirt-col > div {
            min-height: auto !important;
          }

          /* Mobile canvas: full width, reduced height. 3D viewer auto-scales to container. */
          .sticky-tshirt-col .canvas-frame-box {
            transition: transform 0.35s ease, margin-bottom 0.35s ease;
          }

          /* When drawer is open: shrink canvas height more */
          .drawer-open .sticky-tshirt-col {
            margin-top: 0px !important;
          }
          .drawer-open .mobile-top-bar {
            top: 5px !important;
          }

          /* Mobile Tabs Styling */
          .mobile-nav-pills {
            background: #f1f5f9;
            border-radius: 12px;
            padding: 4px;
            gap: 2px;
            display: flex;
            width: 100%;
          }
          
          .mobile-nav-pills .nav-item {
            flex: 1;
          }
          
          .mobile-nav-pills .nav-link {
            color: #64748b;
            font-size: 10px;
            font-weight: 700;
            padding: 6px 4px;
            text-align: center;
            border-radius: 8px;
            transition: all 0.2s ease;
          }
          
          .mobile-nav-pills .nav-link.active {
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          }
          
          .mobile-nav-pills .nav-link.bg-danger {
            background: linear-gradient(135deg,#ff8525,#e53e3e) !important;
            color: #ffffff !important;
          }
          
          .mobile-tab-content {
            font-size: 11px;
          }

          /* Shrink all text inside mobile tabs for compact mobile view */
          .mobile-tab-content .form-label,
          .mobile-tab-content label {
            font-size: 10px !important;
            margin-bottom: 2px !important;
          }
          .mobile-tab-content .form-control,
          .mobile-tab-content .form-select,
          .mobile-tab-content input,
          .mobile-tab-content select {
            font-size: 11px !important;
            padding: 4px 8px !important;
            height: auto !important;
          }
          .mobile-tab-content .btn {
            font-size: 10.5px !important;
            padding: 4.5px 8px !important;
          }
          .mobile-tab-content .small,
          .mobile-tab-content small {
            font-size: 9.5px !important;
          }
          .mobile-tab-content .fw-bold,
          .mobile-tab-content .fw-semibold {
            font-size: 10px !important;
          }
        }
      `}</style>
    </Container>
  );
}