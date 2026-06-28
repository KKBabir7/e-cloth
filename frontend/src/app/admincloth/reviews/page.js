'use client';


import React, { useEffect, useState, useCallback } from 'react';
import {
  Row, Col, Card, Table, Badge, Button, Form,
  Modal, InputGroup, Spinner
} from 'react-bootstrap';
import {
  IoStarOutline, IoStar, IoTrashOutline, IoPencilOutline,
  IoSearchOutline, IoReloadOutline, IoCheckmarkCircleOutline,
  IoCloseCircleOutline, IoFilterOutline, IoChevronUpOutline,
  IoChevronDownOutline, IoChatbubblesOutline, IoWarningOutline,
  IoChevronForwardOutline
} from 'react-icons/io5';
import axios from 'axios';
import { useUI } from '../../../context/UIContext';
import { getBackendUrl } from '@/utils/api';

/* ─── Star Renderer ────────────────────────────────────────── */
const StarRow = ({ rating, size = 14, interactive = false, onChange }) => (
  <span className="d-inline-flex gap-1" style={{ fontSize: size }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        onClick={() => interactive && onChange && onChange(s)}
        style={{ cursor: interactive ? 'pointer' : 'default', transition: 'transform .1s' }}
        className={s <= rating ? 'text-warning' : 'text-secondary'}
        title={interactive ? `${s} stars` : undefined}
      >
        {s <= rating ? '★' : '☆'}
      </span>
    ))}
  </span>
);

/* ─── Main Component ────────────────────────────────────────── */
export default function AdminReviewsPage() {
  const { showToast } = useUI();

  /* state */
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortDir, setSortDir] = useState('desc');

  /* edit modal */
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null); // { productId, reviewId, name, rating, comment }
  const [saving, setSaving] = useState(false);

  /* delete confirmation */
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { productId, reviewId, name }
  const [deleting, setDeleting] = useState(false);

  /* expanded products state */
  const [expandedProducts, setExpandedProducts] = useState({});
  const toggleProductExpand = (id) => {
    setExpandedProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* add review modal state */
  const [addModal, setAddModal] = useState(false);
  const [addData, setAddData] = useState({ productId: '', name: '', rating: 5, comment: '' });
  const [addingReview, setAddingReview] = useState(false);
  const [productList, setProductList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchProductsList = async () => {
    setLoadingProducts(true);
    try {
      const res = await axios.get(`${getBackendUrl()}/api/products?limit=500`, { withCredentials: true });
      if (res.data.success) {
        setProductList(res.data.products || []);
        if (res.data.products?.length > 0) {
          setAddData(prev => ({ ...prev, productId: res.data.products[0]._id }));
        }
      }
    } catch (err) {
      showToast('Could not fetch products list.', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddReviewSubmit = async (e) => {
    e.preventDefault();
    if (!addData.productId) {
      showToast('Please select a product.', 'error');
      return;
    }
    if (!addData.name.trim() || !addData.comment.trim()) {
      showToast('Reviewer name and comment are required.', 'error');
      return;
    }
    setAddingReview(true);
    try {
      const res = await axios.post(
        `${getBackendUrl()}/api/products/${addData.productId}/reviews`,
        { name: addData.name, rating: addData.rating, comment: addData.comment },
        { withCredentials: true }
      );
      if (res.data.success) {
        showToast('Custom review added successfully!', 'success');
        setAddModal(false);
        setAddData({ productId: '', name: '', rating: 5, comment: '' });
        fetchAll();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add custom review.', 'error');
    } finally {
      setAddingReview(false);
    }
  };

  /* ── Fetch all reviews directly (Admin API) ─── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getBackendUrl()}/api/products/reviews/all`, { withCredentials: true });
      if (res.data.success) {
        setAllReviews(res.data.reviews || []);
      }
    } catch (err) {
      showToast('Could not load reviews from server.', 'error');
      setAllReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Flatten all reviews into one table-friendly list ─── */
  const flatReviews = allReviews;

  /* ── Filter / Sort ─── */
  const filtered = flatReviews
    .filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        r.name.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q);
      const matchRating = filterRating === 'all' || r.rating === Number(filterRating);
      return matchSearch && matchRating;
    })
    .sort((a, b) => {
      let val = 0;
      if (sortBy === 'rating') val = a.rating - b.rating;
      else if (sortBy === 'name') val = a.name.localeCompare(b.name);
      else val = new Date(a.createdAt) - new Date(b.createdAt);
      return sortDir === 'desc' ? -val : val;
    });

  // Group filtered reviews by product
  const groupedReviews = {};
  filtered.forEach(rev => {
    if (!groupedReviews[rev.productId]) {
      groupedReviews[rev.productId] = {
        productId: rev.productId,
        productName: rev.productName,
        reviews: []
      };
    }
    groupedReviews[rev.productId].reviews.push(rev);
  });
  const groupedList = Object.values(groupedReviews);

  /* ── Stats ─── */
  const totalReviews = flatReviews.length;
  const avgRating = totalReviews > 0
    ? (flatReviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
    : '—';
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: flatReviews.filter((r) => r.rating === s).length
  }));

  /* ── Delete handler ─── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(
        `${getBackendUrl()}/api/products/${deleteTarget.productId}/reviews/${deleteTarget.reviewId}`,
        { withCredentials: true }
      );
      showToast(`Review by "${deleteTarget.name}" deleted successfully.`, 'success');
      setDeleteModal(false);
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  /* ── Save Edit handler ─── */
  const handleSaveEdit = async () => {
    if (!editData) return;
    if (!editData.name.trim() || !editData.comment.trim()) {
      showToast('Name and comment are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        `${getBackendUrl()}/api/products/${editData.productId}/reviews/${editData.reviewId}`,
        { name: editData.name, rating: editData.rating, comment: editData.comment },
        { withCredentials: true }
      );
      showToast('Review updated successfully!', 'success');
      setEditModal(false);
      setEditData(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Sort toggle ─── */
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) =>
    sortBy === field
      ? (sortDir === 'desc' ? <IoChevronDownOutline size={13} /> : <IoChevronUpOutline size={13} />)
      : null;

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="d-flex flex-column gap-4">

      {/* ── PAGE HEADER ─── */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <h4 className="fw-extrabold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
            <IoChatbubblesOutline className="text-danger" size={26} />
            Customer Reviews Management
          </h4>
          <p className="text-muted small mb-0">
            Monitor, edit, and moderate all product reviews across your catalog.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="danger"
            size="sm"
            className="d-flex align-items-center gap-2 fw-bold bg-red-gradient border-0 px-3"
            onClick={() => {
              fetchProductsList();
              setAddModal(true);
            }}
          >
            + Add Custom Review
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            className="d-flex align-items-center gap-2 fw-bold"
            onClick={fetchAll}
            disabled={loading}
          >
            <IoReloadOutline size={16} className={loading ? 'spin-icon' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── ANALYTICS CARDS ─── */}
      <Row className="g-3">
        <Col md={3} xs={6}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3 text-center">
            <div className="fs-2 fw-extrabold text-danger">{totalReviews}</div>
            <div className="small text-muted">Total Reviews</div>
          </Card>
        </Col>
        <Col md={3} xs={6}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3 text-center">
            <div className="fs-2 fw-extrabold text-warning">{avgRating}</div>
            <div className="small text-muted">Average Rating</div>
          </Card>
        </Col>
        <Col md={3} xs={6}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3 text-center">
            <div className="fs-2 fw-extrabold" style={{ color: 'var(--primary-navy)' }}>
              {flatReviews.filter((r) => r.rating >= 4).length}
            </div>
            <div className="small text-muted">Positive (4-5 ★)</div>
          </Card>
        </Col>
        <Col md={3} xs={6}>
          <Card className="custom-card border-0 shadow-sm bg-white p-3 text-center">
            <div className="fs-2 fw-extrabold text-secondary">
              {flatReviews.filter((r) => r.rating <= 2).length}
            </div>
            <div className="small text-muted">Negative (1-2 ★)</div>
          </Card>
        </Col>
      </Row>

      {/* ── RATING DISTRIBUTION BAR ─── */}
      <Card className="custom-card border-0 shadow-sm bg-white p-4">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--primary-navy)' }}>Rating Distribution</h6>
        <div className="d-flex flex-column gap-2">
          {starCounts.map(({ star, count }) => {
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="d-flex align-items-center gap-3" style={{ fontSize: '13px' }}>
                <span className="text-muted" style={{ minWidth: '40px' }}>{star} ★</span>
                <div className="progress flex-grow-1" style={{ height: '10px', borderRadius: '6px', backgroundColor: '#E2E8F0' }}>
                  <div
                    className="progress-bar"
                    style={{
                      width: `${pct}%`,
                      borderRadius: '6px',
                      background: star >= 4
                        ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                        : star === 3
                          ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                          : 'linear-gradient(90deg,#ef4444,#dc2626)',
                      transition: 'width .5s ease'
                    }}
                  />
                </div>
                <span className="fw-semibold text-dark" style={{ minWidth: '26px' }}>{count}</span>
                <span className="text-muted" style={{ minWidth: '38px' }}>{Math.round(pct)}%</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── FILTERS ROW ─── */}
      <Card className="custom-card border-0 shadow-sm bg-white p-3">
        <Row className="gy-2 align-items-end">
          <Col md={5}>
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                <IoSearchOutline className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by reviewer name, product, or comment…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-start-0 py-2"
                style={{ fontSize: '14px' }}
              />
              {search && (
                <Button variant="outline-secondary" onClick={() => setSearch('')} style={{ borderRadius: '0 6px 6px 0' }}>
                  <IoCloseCircleOutline size={16} />
                </Button>
              )}
            </InputGroup>
          </Col>
          <Col md={3}>
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                <IoFilterOutline className="text-muted" size={15} />
              </InputGroup.Text>
              <Form.Select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="border-start-0 py-2"
                style={{ fontSize: '14px' }}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars Only</option>
                <option value="4">4 Stars Only</option>
                <option value="3">3 Stars Only</option>
                <option value="2">2 Stars Only</option>
                <option value="1">1 Star Only</option>
              </Form.Select>
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2"
              style={{ fontSize: '14px' }}
            >
              <option value="newest">Newest First</option>
              <option value="rating">By Rating</option>
              <option value="name">By Reviewer Name</option>
            </Form.Select>
          </Col>
          <Col md={1} className="text-end">
            <span className="small text-muted fw-semibold">{filtered.length} results</span>
          </Col>
        </Row>
      </Card>

      {/* ── REVIEWS GROUPED BY PRODUCT ─── */}
      <Card className="custom-card border-0 shadow-sm bg-white">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
            <p className="mt-3 text-muted small">Loading reviews…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <IoChatbubblesOutline size={48} className="mb-3 opacity-30" />
            <p className="fw-semibold mb-1">No reviews match your filters.</p>
            <p className="small">Try adjusting your search or rating filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover={false} className="align-middle mb-0" style={{ fontSize: '13.5px' }}>
              <thead className="table-light" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ width: '50px' }} className="ps-4"></th>
                  <th>Product</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Total Reviews</th>
                  <th style={{ width: '180px', textAlign: 'center' }}>Average Rating</th>
                  <th style={{ width: '150px' }} className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedList.map((prod) => {
                  const isExpanded = !!expandedProducts[prod.productId];
                  const prodAvgRating = (prod.reviews.reduce((s, r) => s + r.rating, 0) / prod.reviews.length).toFixed(1);
                  return (
                    <React.Fragment key={prod.productId}>
                      {/* Product Group Row */}
                      <tr 
                        className="border-bottom border-light align-middle" 
                        style={{ cursor: 'pointer', backgroundColor: '#F8FAFC' }} 
                        onClick={() => toggleProductExpand(prod.productId)}
                      >
                        <td className="ps-4">
                          {isExpanded 
                            ? <IoChevronDownOutline size={16} className="text-danger" /> 
                            : <IoChevronForwardOutline size={16} className="text-muted" />
                          }
                        </td>
                        <td>
                          <span className="fw-bold text-dark">{prod.productName}</span>
                        </td>
                        <td className="text-center">
                          <Badge bg="danger" className="bg-red-gradient px-3 py-2" style={{ borderRadius: '20px', fontSize: '11px' }}>
                            {prod.reviews.length}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <span className="fw-bold text-warning">{prodAvgRating} ★</span>
                            <StarRow rating={Math.round(Number(prodAvgRating))} size={13} />
                          </div>
                        </td>
                        <td className="text-end pe-4" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="link" 
                            className="text-danger p-0 fw-bold text-decoration-none small"
                            onClick={() => toggleProductExpand(prod.productId)}
                          >
                            {isExpanded ? 'Collapse' : 'Expand'} ({prod.reviews.length})
                          </Button>
                        </td>
                      </tr>

                      {/* Expanded nested list of reviews */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-0">
                            <div className="bg-white px-4 py-3 border-bottom" style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.02)' }}>
                              <Table hover borderless size="sm" className="align-middle mb-0" style={{ fontSize: '13px' }}>
                                <thead className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9' }}>
                                  <tr>
                                    <th style={{ width: '180px' }} className="py-2">Reviewer</th>
                                    <th style={{ width: '120px' }} className="py-2">Rating</th>
                                    <th className="py-2">Comment</th>
                                    <th style={{ width: '120px' }} className="py-2">Date</th>
                                    <th style={{ width: '130px' }} className="text-end py-2">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prod.reviews.map((rev) => (
                                    <tr key={rev._id} className="border-bottom border-light-subtle">
                                      <td className="py-3">
                                        <div className="d-flex align-items-center gap-2">
                                          <div
                                            className="rounded-circle bg-danger bg-opacity-10 text-danger fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: 28, height: 28, fontSize: 12 }}
                                          >
                                            {rev.name.charAt(0).toUpperCase()}
                                          </div>
                                          <span className="fw-semibold text-dark">{rev.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-3">
                                        <div className="d-flex flex-column gap-1">
                                          <StarRow rating={rev.rating} size={13} />
                                          <Badge
                                            bg={rev.rating >= 4 ? 'success' : rev.rating === 3 ? 'warning' : 'danger'}
                                            className="w-auto align-self-start py-1 px-2"
                                            style={{ fontSize: '9px' }}
                                          >
                                            {rev.rating >= 4
                                              ? 'Positive'
                                              : rev.rating === 3
                                                ? 'Neutral'
                                                : 'Negative'
                                            }
                                          </Badge>
                                        </div>
                                      </td>
                                      <td className="py-3 text-muted">
                                        "{rev.comment}"
                                      </td>
                                      <td className="py-3 text-muted" style={{ fontSize: '12px' }}>
                                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                                          year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                      </td>
                                      <td className="text-end py-3">
                                        <div className="d-flex gap-2 justify-content-end">
                                          <Button
                                            size="sm"
                                            variant="outline-primary"
                                            className="d-flex align-items-center gap-1 px-2 py-1"
                                            style={{ fontSize: '11px', borderRadius: '4px' }}
                                            onClick={() => {
                                              setEditData({
                                                productId: prod.productId,
                                                reviewId: rev._id,
                                                name: rev.name,
                                                rating: rev.rating,
                                                comment: rev.comment,
                                                productName: prod.productName
                                              });
                                              setEditModal(true);
                                            }}
                                          >
                                            <IoPencilOutline size={11} /> Edit
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline-danger"
                                            className="d-flex align-items-center gap-1 px-2 py-1"
                                            style={{ fontSize: '11px', borderRadius: '4px' }}
                                            onClick={() => {
                                              setDeleteTarget({ productId: prod.productId, reviewId: rev._id, name: rev.name });
                                              setDeleteModal(true);
                                            }}
                                          >
                                            <IoTrashOutline size={11} /> Delete
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
      


      {/* ── EDIT REVIEW MODAL ─── */}
      <Modal show={editModal} onHide={() => setEditModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-navy)', fontSize: '18px' }}>
            <IoPencilOutline className="me-2 text-primary" />
            Edit Customer Review
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 px-4 pb-4">
          {editData && (
            <>
              <div className="p-3 rounded-3 mb-4 border" style={{ background: '#F8FAFC', borderLeft: '4px solid var(--accent-red) !important' }}>
                <small className="text-muted d-block">Product</small>
                <strong className="text-dark">{editData.productName}</strong>
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Reviewer Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="form-control-premium py-2"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Rating *</Form.Label>
                <div className="d-flex align-items-center gap-3">
                  <StarRow
                    rating={editData.rating}
                    size={28}
                    interactive
                    onChange={(s) => setEditData({ ...editData, rating: s })}
                  />
                  <Badge bg={editData.rating >= 4 ? 'success' : editData.rating === 3 ? 'warning' : 'danger'}>
                    {editData.rating} / 5
                  </Badge>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Review Comment *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={editData.comment}
                  onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                  className="form-control-premium"
                  placeholder="Review text..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setEditModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="bg-red-gradient border-0 fw-bold px-4"
            onClick={handleSaveEdit}
            disabled={saving}
          >
            {saving ? <><Spinner size="sm" animation="border" className="me-2" />Saving…</> : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── ADD CUSTOM REVIEW MODAL ─── */}
      <Modal show={addModal} onHide={() => setAddModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: 'var(--primary-navy)', fontSize: '18px' }}>
            <IoChatbubblesOutline className="me-2 text-danger" />
            Add Custom / Mock Review
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 px-4 pb-4">
          <Form onSubmit={handleAddReviewSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Select Product *</Form.Label>
              {loadingProducts ? (
                <div className="d-flex align-items-center gap-2 text-muted small py-2">
                  <Spinner size="sm" animation="border" /> Loading products list…
                </div>
              ) : (
                <Form.Select
                  value={addData.productId}
                  onChange={(e) => setAddData({ ...addData, productId: e.target.value })}
                  className="form-control-premium py-2"
                  required
                >
                  <option value="" disabled>-- Select a Product --</option>
                  {productList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Reviewer Display Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Tanvir Rahman"
                value={addData.name}
                onChange={(e) => setAddData({ ...addData, name: e.target.value })}
                className="form-control-premium py-2"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Rating *</Form.Label>
              <div className="d-flex align-items-center gap-3">
                <StarRow
                  rating={addData.rating}
                  size={28}
                  interactive
                  onChange={(s) => setAddData({ ...addData, rating: s })}
                />
                <Badge bg={addData.rating >= 4 ? 'success' : addData.rating === 3 ? 'warning' : 'danger'}>
                  {addData.rating} / 5
                </Badge>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Review Comment *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={addData.comment}
                onChange={(e) => setAddData({ ...addData, comment: e.target.value })}
                className="form-control-premium"
                placeholder="Write what the fake customer says..."
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={() => setAddModal(false)} disabled={addingReview}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                className="bg-red-gradient border-0 fw-bold px-4"
                disabled={addingReview}
              >
                {addingReview ? <><Spinner size="sm" animation="border" className="me-2" />Adding…</> : 'Publish Review'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ── DELETE CONFIRMATION MODAL ─── */}
      <Modal show={deleteModal} onHide={() => setDeleteModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-danger" style={{ fontSize: '17px' }}>
            <IoTrashOutline className="me-2" /> Delete Review
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center px-4">
          <div
            className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: 60, height: 60 }}
          >
            <IoWarningOutline size={28} className="text-danger" />
          </div>
          <p className="text-dark fw-semibold mb-1">Are you sure?</p>
          <p className="text-muted small mb-0">
            You are about to permanently delete the review by{' '}
            <strong className="text-dark">"{deleteTarget?.name}"</strong>.
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center gap-3">
          <Button variant="light" onClick={() => setDeleteModal(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="fw-bold px-4"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Spinner size="sm" animation="border" /> : 'Yes, Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Inline styles for spin animation */}
      <style>{`
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
}
