const fs = require('fs');

// Read the files
const file = 'f:/ecommarce/frontend/src/app/design/page.js';
let content = fs.readFileSync(file, 'utf8');
const functionsStr = fs.readFileSync('f:/ecommarce/frontend/src/app/design/functions.txt', 'utf8');

// 1. Find desktop tabs section and replace it
const extractTab = (eventKey, titleKey) => {
  const startStr = '<Tab eventKey="' + eventKey + '" title="' + titleKey + '">';
  const startIdx = content.indexOf(startStr);
  if (startIdx === -1) return null;
  const contentStartIdx = content.indexOf('>', startIdx) + 1;
  
  let endIdx = contentStartIdx;
  let depth = 1;
  while(endIdx < content.length && depth > 0) {
     const nextTabStart = content.indexOf('<Tab ', endIdx);
     const nextTabEnd = content.indexOf('</Tab>', endIdx);
     if (nextTabEnd === -1) break;
     
     if (nextTabStart !== -1 && nextTabStart < nextTabEnd) {
         depth++;
         endIdx = nextTabStart + 4;
     } else {
         depth--;
         if (depth === 0) {
             endIdx = nextTabEnd;
             break;
         }
         endIdx = nextTabEnd + 6;
     }
  }
  return { startIdx, endIdx: endIdx + 6 };
};

const textTab = extractTab('text', 'Text');
const imageTab = extractTab('image', 'Image');
const shapeTab = extractTab('shape', 'Shape');
const stickerTab = extractTab('sticker', 'Sticker');

if (!textTab || !imageTab || !shapeTab || !stickerTab) {
    console.error("Could not find all desktop tabs!");
    process.exit(1);
}

// Ensure they are contiguous (roughly) and replace them all
const desktopTabsStart = textTab.startIdx;
const desktopTabsEnd = stickerTab.endIdx;
const desktopReplacement = `
                <Tab eventKey="text" title="Text"><TextTabContent /></Tab>
                <Tab eventKey="image" title="Image"><ImageTabContent /></Tab>
                <Tab eventKey="shape" title="Shape"><ShapeTabContent /></Tab>
                <Tab eventKey="sticker" title="Sticker"><StickerTabContent /></Tab>
`;

content = content.substring(0, desktopTabsStart) + desktopReplacement + content.substring(desktopTabsEnd);

// 2. Remove the old `renderMobileDrawerContent` if it exists
const oldMobileDrawerStart = content.indexOf('const renderMobileDrawerContent = () => {');
if (oldMobileDrawerStart !== -1) {
    let depth = 0;
    let endIdx = oldMobileDrawerStart;
    let started = false;
    while (endIdx < content.length) {
        if (content[endIdx] === '{') {
            depth++;
            started = true;
        } else if (content[endIdx] === '}') {
            depth--;
        }
        endIdx++;
        if (started && depth === 0) break;
    }
    // Also remove any trailing newline or semicolon
    while (content[endIdx] === ';' || content[endIdx] === '\n' || content[endIdx] === ' ') endIdx++;
    content = content.substring(0, oldMobileDrawerStart) + content.substring(endIdx);
}

// 3. Inject the function definitions right before the mobile view
const mobileStartIdx = content.indexOf('if (isMounted && isMobileView) {');
if (mobileStartIdx === -1) {
    console.error("Could not find mobile view start!");
    process.exit(1);
}

// 4. Find the end of the mobile block
let mobileEndIdx = mobileStartIdx;
let depth = 0;
let started = false;
while (mobileEndIdx < content.length) {
    if (content[mobileEndIdx] === '{') {
        depth++;
        started = true;
    } else if (content[mobileEndIdx] === '}') {
        depth--;
    }
    mobileEndIdx++;
    if (started && depth === 0) break;
}

// 5. Build the NEW mobile block (PicsArt Style)
const newMobileBlock = `if (isMounted && isMobileView) {
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
                <div style={{ transform: \`scale(\${Math.min(mobileScale * 1.25, 0.9)})\`, transformOrigin: 'top center' }}>
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
                    <button onClick={() => setTshirtView('front')} className={\`btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center \${tshirtView === 'front' ? 'bg-dark text-white' : 'bg-transparent text-secondary'}\`} style={{ width: '32px', height: '32px' }} title="Front View">
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>F</span>
                    </button>
                    <button onClick={() => setTshirtView('back')} className={\`btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center \${tshirtView === 'back' ? 'bg-dark text-white' : 'bg-transparent text-secondary'}\`} style={{ width: '32px', height: '32px' }} title="Back View">
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
                                      <button type="button" onClick={() => setGarmentType('tshirt')} className={\`flex-fill border py-2 rounded-3 fw-bold \${garmentType === 'tshirt' ? 'bg-dark text-white shadow-sm' : 'bg-light text-secondary border-light'}\`} style={{ fontSize: '12px' }}>T-Shirt</button>
                                      <button type="button" onClick={() => setGarmentType('polo')} className={\`flex-fill border py-2 rounded-3 fw-bold \${garmentType === 'polo' ? 'bg-dark text-white shadow-sm' : 'bg-light text-secondary border-light'}\`} style={{ fontSize: '12px' }}>Polo</button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="fw-bold mb-2 small text-secondary text-uppercase" style={{ letterSpacing: '1px', fontSize: '10px' }}>Fabric Color</label>
                                    <div className="d-flex flex-wrap gap-2">
                                      {displayColors.map((color) => {
                                        const isSelected = tshirtColor.toLowerCase() === color.hex.toLowerCase();
                                        const imageUrl = color.image ? (color.image.startsWith('http') ? color.image : \`\${getBackendUrl()}\${color.image}\`) : null;
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
                                          <button key={s} type="button" onClick={() => setSelectedSize(s)} className={\`btn fw-bold px-3 py-1 \${selectedSize === s ? 'bg-dark text-white shadow-sm' : 'bg-light text-secondary'}\`} style={{ borderRadius: '8px', fontSize: '12px' }}>{s}</button>
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
  }`;

content = content.substring(0, mobileStartIdx) + functionsStr + newMobileBlock + content.substring(mobileEndIdx);

fs.writeFileSync('f:/ecommarce/frontend/src/app/design/page.updated.js', content);
console.log('Successfully wrote to page.updated.js');
