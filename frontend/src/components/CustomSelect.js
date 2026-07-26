'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IoChevronDown } from 'react-icons/io5';

export default function CustomSelect({ value, options, onChange, placeholder = "Select...", hasSearch = false, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 992);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [dropdownDirection, setDropdownDirection] = useState('down');

  const checkDropdownDirection = () => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 310) {
      setDropdownDirection('up');
    } else {
      setDropdownDirection('down');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkDropdownDirection();
      window.addEventListener('scroll', checkDropdownDirection, true);
      window.addEventListener('resize', checkDropdownDirection);
    }
    return () => {
      window.removeEventListener('scroll', checkDropdownDirection, true);
      window.removeEventListener('resize', checkDropdownDirection);
    };
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="position-relative w-100" ref={dropdownRef}>
      <div 
        className="form-control-premium d-flex align-items-center justify-content-between"
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: isMobile ? '3px 10px' : '10px 16px',
          borderRadius: isMobile ? '6px' : '8px',
          border: '1px solid #E2E8F0',
          backgroundColor: disabled ? '#F1F5F9' : '#ffffff',
          opacity: disabled ? 0.7 : 1,
          userSelect: 'none',
          fontSize: isMobile ? '11px' : '14px',
          fontWeight: '500',
          minHeight: isMobile ? '28px' : '42px',
          height: isMobile ? '28px' : 'auto',
          transition: 'all 0.2s ease-in-out',
          gap: isMobile ? '8px' : '16px'
        }}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
      >
        <span style={{ fontFamily: selectedOption?.style?.fontFamily || 'inherit' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <IoChevronDown 
          style={{ 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: '#64748B',
            flexShrink: 0
          }} 
        />
      </div>

      {isOpen && (
        <div 
          className="position-absolute bg-white border rounded shadow-lg d-flex flex-column"
          style={{
            zIndex: 1000,
            maxHeight: '300px',
            borderRadius: '8px',
            boxShadow: dropdownDirection === 'down'
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
              : '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.1)',
            minWidth: '100%',
            width: 'max-content',
            right: 0,
            top: dropdownDirection === 'down' ? '100%' : 'auto',
            bottom: dropdownDirection === 'up' ? '100%' : 'auto',
            marginTop: dropdownDirection === 'down' ? '4px' : '0',
            marginBottom: dropdownDirection === 'up' ? '4px' : '0',
            overflow: 'hidden'
          }}
        >
          {hasSearch && (
            <div className="p-2 border-bottom bg-white flex-shrink-0">
              <input 
                type="text" 
                className="form-control form-control-sm select-search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: '13px', borderRadius: '6px' }}
              />
            </div>
          )}
          
          <div 
            className="flex-grow-1" 
            style={{ 
              overflowY: 'auto', 
              padding: '4px 0',
              maxHeight: '240px'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-center text-muted small">No matches found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    className="px-3 py-2 cursor-pointer custom-select-option-item"
                    style={{
                      backgroundColor: isSelected ? '#ff8525' : 'transparent',
                      color: isSelected ? '#ffffff' : '#2a2c32',
                      fontFamily: opt.style?.fontFamily || 'inherit',
                      fontSize: '14px',
                      transition: 'background-color 0.15s, color 0.15s',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    {opt.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
