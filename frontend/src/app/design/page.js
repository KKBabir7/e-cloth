'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import BrandLoader from '../../components/BrandLoader';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Row, Col, Card, Button, Form, Tabs, Tab, Modal, InputGroup } from 'react-bootstrap';
import {
  IoText, IoImage, IoSquare, IoTrash, IoArrowDown, IoArrowUp, IoPushOutline,
  IoChevronDown, IoDownload, IoCart, IoReload, IoSave, IoSearch, IoMove,
  IoAdd, IoCopy, IoSunnyOutline, IoContrastOutline, IoEyeOutline, IoResizeOutline, IoColorPaletteOutline,
  IoEllipse, IoTriangle, IoStar, IoHeart
} from 'react-icons/io5';
import { FiAlignLeft, FiAlignCenter, FiAlignRight, FiEye, FiEyeOff, FiLock, FiUnlock } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/cartSlice';
import { useUI } from '../../context/UIContext';
import axios from 'axios';
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
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(0);

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

  useEffect(() => {
    if (!canvas) return;

    updateLayersList();

    const handleCanvasChange = () => {
      updateLayersList();
    };

    canvas.on('object:added', handleCanvasChange);
    canvas.on('object:removed', handleCanvasChange);
    canvas.on('object:modified', handleCanvasChange);
    canvas.on('selection:created', handleCanvasChange);
    canvas.on('selection:updated', handleCanvasChange);
    canvas.on('selection:cleared', handleCanvasChange);

    return () => {
      canvas.off('object:added', handleCanvasChange);
      canvas.off('object:removed', handleCanvasChange);
      canvas.off('object:modified', handleCanvasChange);
      canvas.off('selection:created', handleCanvasChange);
      canvas.off('selection:updated', handleCanvasChange);
      canvas.off('selection:cleared', handleCanvasChange);
    };
  }, [canvas]);

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
        setStrokeColor(obj.stroke || '#ffffff');
        setStrokeWidth(obj.strokeWidth || 0);
      } else if (obj.type === 'image') {
        if (obj.isSticker) {
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
        setShapeColor(obj.fill || '#ff8525');
        setShapeOpacity(obj.opacity !== undefined ? obj.opacity : 1);
        setShapeScale(obj.scaleX !== undefined ? obj.scaleX : 1);
        setShapeRotation(obj.angle !== undefined ? obj.angle : 0);
        setShapeStrokeColor(obj.stroke || '#ffffff');
        setShapeStrokeWidth(obj.strokeWidth !== undefined ? obj.strokeWidth : 0);
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
    fCanvas.on('object:scaling', (e) => clampObject(e.target, 440));
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
    bCanvas.on('object:scaling', (e) => clampObject(e.target, 440));
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
          activeObj.set({
            text: textInput,
            fill: textColor,
            fontSize: parseInt(fontSize),
            fontFamily: fontFamily,
            fontWeight: fontWeight,
            textAlign: textAlign,
            fontStyle: fontStyle,
            underline: isUnderline,
            linethrough: isLinethrough,
            charSpacing: letterSpacing * 10,
            stroke: strokeWidth > 0 ? strokeColor : null,
            strokeWidth: strokeWidth
          });

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
        activeObj.set({
          text: textInput,
          fill: textColor,
          fontSize: parseInt(fontSize),
          fontFamily: fontFamily,
          fontWeight: fontWeight,
          textAlign: textAlign,
          fontStyle: fontStyle,
          underline: isUnderline,
          linethrough: isLinethrough,
          charSpacing: letterSpacing * 10,
          stroke: strokeWidth > 0 ? strokeColor : null,
          strokeWidth: strokeWidth
        });

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
  }, [textInput, textColor, fontSize, fontFamily, fontWeight, textAlign, fontStyle, isUnderline, isLinethrough, letterSpacing, strokeColor, strokeWidth, canvas]);

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
      const frontJson = frontCanvas ? frontCanvas.toJSON() : null;
      const backJson = backCanvas ? backCanvas.toJSON() : null;
      const canvasJson = { front: frontJson, back: backJson };

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

                  {/* Letter Spacing */}
                  <Form.Group>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Form.Label className="small fw-semibold text-secondary m-0">Letter Spacing</Form.Label>
                      <span className="small text-dark fw-bold">{letterSpacing}px</span>
                    </div>
                    <Form.Range 
                      min={-5} 
                      max={20} 
                      value={letterSpacing}
                      onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
                    />
                  </Form.Group>

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
              </Tab>

              {/* Image uploads */}
              <Tab eventKey="image" title="Image">
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
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{imageRotation}°</span>
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
              </Tab>

              {/* Shape insertion and adjustments */}
              <Tab eventKey="shape" title="Shape">
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
                            <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{shapeRotation}°</span>
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
              </Tab>

              {/* Sticker tab */}
              <Tab eventKey="sticker" title="Sticker">
                <div className="d-flex flex-column gap-3 pt-2">
                  <div>
                    <span className="small fw-semibold text-secondary d-block mb-2">Choose Sticker</span>
                    <div className="d-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {DEMO_STICKERS.map((st, idx) => (
                        <div 
                          key={idx}
                          className="border rounded p-1 text-center"
                          style={{ 
                            cursor: 'pointer', 
                            backgroundColor: '#F8FAFC', 
                            transition: 'all 0.2s',
                            borderRadius: '8px',
                            borderWidth: '1px'
                          }}
                          onClick={() => handleAddSticker(st.url)}
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
                          <img src={st.url} alt={st.name} style={{ width: '100%', height: '40px', objectFit: 'contain' }} />
                        </div>
                      ))}
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
                          <span className="text-dark fw-bold" style={{ fontSize: '10px' }}>{stickerRotation}°</span>
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
              </Tab>
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
                                <span className="text-muted" style={{ fontSize: '10px', cursor: 'grab' }}>☰</span>
                                
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
        <Col lg={6} className="text-center sticky-tshirt-col">
          <div className="glass-panel p-4 bg-white d-flex flex-column align-items-center justify-content-center relative" style={{ minHeight: '520px' }}>
            
            {/* Display Mode Switcher (2D Editor vs 3D Preview) */}
            <div className="d-flex justify-content-between align-items-center w-100 mb-3 px-2 flex-wrap gap-2">
              <div className="d-flex gap-2 bg-light p-1 rounded-3">
                <Button
                  variant={displayMode === '2d' ? 'dark' : 'light'}
                  onClick={() => setDisplayMode('2d')}
                  size="sm"
                  className="px-3 fw-bold"
                >
                  2D Studio Editor
                </Button>
                <Button
                  variant={displayMode === '3d' ? 'danger' : 'light'}
                  onClick={() => setDisplayMode('3d')}
                  size="sm"
                  className={`px-3 fw-bold ${displayMode === '3d' ? 'bg-red-gradient border-0 text-white' : ''}`}
                >
                  3D Interactive Preview
                </Button>
              </div>

              <div className="d-flex gap-2 bg-light p-1 rounded-3">
                <Button
                  variant={tshirtView === 'front' ? 'danger' : 'light'}
                  onClick={() => setTshirtView('front')}
                  size="sm"
                  className="px-2"
                  style={{ fontSize: '12px' }}
                >
                  Front View
                </Button>
                <Button
                  variant={tshirtView === 'back' ? 'danger' : 'light'}
                  onClick={() => setTshirtView('back')}
                  size="sm"
                  className="px-2"
                  style={{ fontSize: '12px' }}
                >
                  Back View
                </Button>
              </div>
            </div>

            {/* Unified T-Shirt 3D/2D Viewer Frame */}
            <div 
              className="position-relative shadow rounded-4 overflow-hidden" 
              style={{
                width: '460px',
                height: '500px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0'
              }}
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
                  top: '45px',
                  left: '109px',
                  zIndex: 3,
                  pointerEvents: 'none'
                }}>
                  <span className="position-absolute badge bg-danger opacity-75" style={{ fontSize: '8px', top: '4px', left: '4px' }}>Print Area</span>
                </div>

                {/* Absolute Canvas overlay wrapper for Front */}
                <div className="position-absolute" style={{
                  top: '45px',
                  left: '109px',
                  zIndex: 4,
                  display: tshirtView === 'front' ? 'block' : 'none'
                }}>
                  <canvas ref={frontCanvasRef} />
                </div>

                {/* Absolute Canvas overlay wrapper for Back */}
                <div className="position-absolute" style={{
                  top: '45px',
                  left: '109px',
                  zIndex: 4,
                  display: tshirtView === 'back' ? 'block' : 'none'
                }}>
                  <canvas ref={backCanvasRef} />
                </div>
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
          />
          {/* Interactive hints watermark overlay */}
          <div className="position-absolute bottom-0 start-50 translate-middle-x pb-3 text-center pointer-events-none" style={{ zIndex: 10 }}>
            <span className="badge bg-dark bg-opacity-75 px-3 py-2 rounded-pill fw-semibold" style={{ fontSize: '11px' }}>
              🖱️ Drag to rotate T-Shirt • 🔍 Scroll to zoom in/out
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
      `}</style>
    </Container>
  );
}
