'use client';


import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BrandLoader from '../../components/BrandLoader';
import { Card, Row, Col, Form, Button, ListGroup, Badge } from 'react-bootstrap';
import {
  IoPersonOutline, IoLocationOutline, IoMailOutline, IoCallOutline,
  IoCreateOutline, IoTrashOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline
} from 'react-icons/io5';
import { useUI } from '../../context/UIContext';
import axios from 'axios';
import { getBackendUrl } from '@/utils/api';
import { loadUser } from '../../store/authSlice';
import { fetchDivisions, fetchDistricts, fetchUpazilas } from '@/utils/bdGeocode';

export default function AccountProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { showToast } = useUI();

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Address inputs
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Load divisions on mount
  useEffect(() => {
    const loadGeoDivisions = async () => {
      const divList = await fetchDivisions();
      setDivisions(divList);
      if (divList.length > 0) {
        setSelectedDivision(divList[0].name);
      }
    };
    loadGeoDivisions();
  }, []);

  // Update districts when division changes
  useEffect(() => {
    if (!selectedDivision) return;
    const loadGeoDistricts = async () => {
      const distList = await fetchDistricts(selectedDivision);
      setDistricts(distList);
      if (distList.length > 0) {
        setSelectedDistrict(distList[0]);
      } else {
        setSelectedDistrict('');
      }
    };
    loadGeoDistricts();
  }, [selectedDivision]);

  // Update upazilas when district changes
  useEffect(() => {
    if (!selectedDistrict) return;
    const loadGeoUpazilas = async () => {
      const upzList = await fetchUpazilas(selectedDistrict);
      setUpazilas(upzList);
      if (upzList.length > 0) {
        setSelectedUpazila(upzList[0]);
      } else {
        setSelectedUpazila('');
      }
    };
    loadGeoUpazilas();
  }, [selectedDistrict]);

  // Sync edit form fields with logged-in user profile
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  if (!user) {
    return <BrandLoader fullPage={false} />;
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName || !editPhone) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setSubmittingProfile(true);
    try {
      const res = await axios.put(`${getBackendUrl()}/api/auth/profile`, {
        name: editName,
        phone: editPhone
      });

      if (res.data.success) {
        showToast('Profile details updated successfully!', 'success');
        setIsEditingProfile(false);
        dispatch(loadUser()); // refresh Redux store
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating profile details', 'error');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!selectedDistrict || !selectedUpazila || !addressLine) {
      showToast('Please specify all fields', 'error');
      return;
    }

    setSubmittingAddress(true);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/auth/addresses`, {
        district: selectedDistrict,
        area: selectedUpazila, // Mapped to Thana/Upazila API dropdown selection
        addressLine
      });

      if (res.data.success) {
        showToast('Address added to book successfully!', 'success');
        setAddressLine('');
        dispatch(loadUser()); // refresh user state
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating address book', 'error');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to remove this address?')) return;

    try {
      const res = await axios.delete(`${getBackendUrl()}/api/auth/addresses/${addressId}`);
      if (res.data.success) {
        showToast('Address removed successfully!', 'info');
        dispatch(loadUser());
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error removing address', 'error');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const res = await axios.put(`${getBackendUrl()}/api/auth/addresses/${addressId}/default`);
      if (res.data.success) {
        showToast('Default shipping address updated!', 'success');
        dispatch(loadUser());
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating default address', 'error');
    }
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
      
      {/* 1. Account Info details */}
      <Card className="custom-card border-0 p-4 shadow-sm bg-white rounded-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
              <IoPersonOutline /> Personal Profile Details
            </h5>
            {!isEditingProfile ? (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
                className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
              >
                <IoCreateOutline size={18} /> Edit Profile
              </Button>
            ) : (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setIsEditingProfile(false);
                  setEditName(user.name);
                  setEditPhone(user.phone);
                }}
                className="d-flex align-items-center gap-1 rounded-3"
              >
                <IoCloseCircleOutline size={18} /> Cancel
              </Button>
            )}
          </div>

          {!isEditingProfile ? (
            <Row className="gy-3">
              <Col md={4}>
                <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                  <IoPersonOutline className="text-danger" size={22} />
                  <div>
                    <span className="text-muted d-block small" style={{ fontSize: '11px' }}>Full Name</span>
                    <span className="fw-bold text-dark">{user.name}</span>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                  <IoMailOutline className="text-danger" size={22} />
                  <div>
                    <span className="text-muted d-block small" style={{ fontSize: '11px' }}>Email Address</span>
                    <span className="fw-bold text-dark">{user.email}</span>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                  <IoCallOutline className="text-danger" size={22} />
                  <div>
                    <span className="text-muted d-block small" style={{ fontSize: '11px' }}>Contact Number</span>
                    <span className="fw-bold text-dark">{user.phone}</span>
                  </div>
                </div>
              </Col>
            </Row>
          ) : (
            <Form onSubmit={handleUpdateProfile}>
              <Row className="gy-3 align-items-end">
                <Col md={4}>
                  <Form.Group controlId="editProfileName">
                    <Form.Label className="small fw-semibold text-dark">Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="form-control-premium"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="editProfilePhone">
                    <Form.Label className="small fw-semibold text-dark">Contact Number (BD) *</Form.Label>
                    <Form.Control
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="form-control-premium"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Button
                    type="submit"
                    disabled={submittingProfile}
                    variant="danger"
                    className="btn-premium-accent bg-red-gradient w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  >
                    <IoCheckmarkCircleOutline size={20} />
                    {submittingProfile ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </Col>
              </Row>
            </Form>
          )}
        </Card.Body>
      </Card>

      {/* 2. Addresses Management Book */}
      <Card className="custom-card border-0 p-4 shadow-sm bg-white rounded-4">
        <Card.Body>
          <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
            <IoLocationOutline /> Saved Address Book
          </h5>

          <Row className="gy-4">
            
            {/* List */}
            <Col lg={7}>
              {user.addresses && user.addresses.length > 0 ? (
                <ListGroup variant="flush" className="gap-2">
                  {user.addresses.map((addr) => (
                    <ListGroup.Item key={addr._id} className="py-3 px-3 border rounded-3 d-flex justify-content-between align-items-center bg-light bg-opacity-50">
                      <div>
                        <div className="fw-bold text-dark">{addr.addressLine}</div>
                        <div className="text-muted small mt-1">{addr.area}, {addr.district}</div>
                        {addr.isDefault && <Badge bg="success" className="mt-2 uppercase" style={{ fontSize: '10px' }}>Default Delivery</Badge>}
                      </div>
                      
                      <div className="d-flex align-items-center gap-2">
                        {!addr.isDefault && (
                          <Button
                            variant="outline-dark"
                            size="sm"
                            style={{ fontSize: '11px' }}
                            onClick={() => handleSetDefaultAddress(addr._id)}
                            className="rounded-2"
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="rounded-2 p-2 d-flex align-items-center justify-content-center"
                        >
                          <IoTrashOutline size={16} />
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                  <IoLocationOutline size={44} className="text-muted mb-2 opacity-50" />
                  <span className="text-muted d-block small">No delivery addresses saved yet.</span>
                </div>
              )}
            </Col>

            {/* Add new shipping */}
            <Col lg={5} className="border-start-lg ps-lg-4">
              <span className="fw-bold d-block mb-3 text-dark" style={{ fontSize: '14px' }}>Add Shipping Address</span>
              <Form onSubmit={handleAddAddress} className="d-flex flex-column gap-3">
                
                <Row className="g-2">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-dark">Division</Form.Label>
                      <Form.Select
                        value={selectedDivision}
                        onChange={(e) => setSelectedDivision(e.target.value)}
                        className="form-control-premium"
                      >
                        {divisions.map((div) => (
                          <option key={div.id} value={div.name}>{div.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-dark">District</Form.Label>
                      <Form.Select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="form-control-premium"
                        disabled={districts.length === 0}
                      >
                        {districts.map((dist, idx) => (
                          <option key={idx} value={dist}>{dist}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label className="small fw-semibold text-dark">Thana / Upazila *</Form.Label>
                  <Form.Select
                    value={selectedUpazila}
                    onChange={(e) => setSelectedUpazila(e.target.value)}
                    className="form-control-premium"
                    disabled={upazilas.length === 0}
                  >
                    {upazilas.map((upz, idx) => (
                      <option key={idx} value={upz}>{upz}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small fw-semibold text-dark">Street / House Address *</Form.Label>
                  <Form.Control
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="form-control-premium"
                    placeholder="e.g. House 14, Road 4"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  disabled={submittingAddress}
                  variant="danger"
                  className="btn-premium-accent justify-content-center bg-red-gradient w-100 py-2 rounded-3 fw-bold mt-2"
                >
                  {submittingAddress ? 'Saving Address...' : 'Save New Address'}
                </Button>
              </Form>
            </Col>

          </Row>
        </Card.Body>
      </Card>

    </div>
  );
}
