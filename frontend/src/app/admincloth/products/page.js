'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Badge } from 'react-bootstrap';
import { IoShirtOutline, IoAdd, IoTrashOutline, IoPencilOutline } from 'react-icons/io5';
import { useUI } from '../../../context/UIContext';
import axios from 'axios';
import { getBackendUrl, getProductImageUrl } from '@/utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function AdminProductsPage() {
  const { showToast } = useUI();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getBackendUrl()}/api/products?limit=100`);
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.warn('Backend server offline, serving mock product inventory database');
      setProducts([
        { _id: 'prod-1', name: 'Summer Breathable Solid T-Shirt', category: 'T-shirt', price: 750, stock: 120 },
        { _id: 'prod-2', name: 'Classic Crimson Polo Shirt', category: 'Polo', price: 1250, stock: 12 },
        { _id: 'prod-3', name: 'Banarasi Premium Punjabi', category: 'Panjabi', price: 4500, stock: 8 },
        { _id: 'prod-4', name: 'Oxford Casual Navy Blue Shirt', category: 'Shirt', price: 1850, stock: 15 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdd = () => {
    router.push('/admincloth/products/add');
  };

  const handleOpenEdit = (prod) => {
    router.push(`/admincloth/products/edit/${prod._id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const res = await axios.delete(`${getBackendUrl()}/api/products/${id}`);
      if (res.data.success) {
        showToast('Product deleted, Redis cache invalidated!', 'success');
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['trending'] });
        fetchInventory();
      }
    } catch (err) {
      console.warn('Offline mode: deleted product locally');
      setProducts(prev => prev.filter(p => p._id !== id));
      showToast('Simulated deletion successful (Offline mode)!', 'success');
    }
  };

  return (
    <Card className="custom-card border-0 p-4 shadow-sm bg-white">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--primary-navy)' }}>
            <IoShirtOutline /> Product Catalogue CRUD Manager
          </h5>
          <Button variant="danger" className="btn-premium-accent bg-red-gradient border-0 px-3 py-2" onClick={handleOpenAdd}>
            <IoAdd size={20} /> Add New Apparel
          </Button>
        </div>

        {loading ? (
          <div className="skeleton mb-3" style={{ height: '150px' }}></div>
        ) : (
          <Table responsive bordered className="align-middle text-center small" style={{ fontSize: '13.5px' }}>
            <thead className="table-dark">
              <tr>
                <th>Apparel Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Inventory Stock</th>
                <th>Status Flags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod._id}>
                  <td className="fw-bold text-start">
                    <div className="d-flex align-items-center gap-2">
                      {prod.images?.[0] && (
                        <img 
                          src={getProductImageUrl(prod.images[0])} 
                          alt={prod.name} 
                          className="rounded-3 border"
                          style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <span className="d-block">{prod.name}</span>
                        {prod.sku && <span className="text-muted d-block font-monospace" style={{ fontSize: '11px' }}>SKU: {prod.sku}</span>}
                      </div>
                    </div>
                  </td>
                  <td><Badge bg="dark">{prod.category}</Badge></td>
                  <td className="fw-extrabold text-danger">৳{prod.price}</td>
                  <td className="fw-bold">
                    {prod.stock} units
                    <div className="mt-1">
                      {prod.stock === 0 ? (
                        <Badge bg="danger">SOLD OUT</Badge>
                      ) : prod.stock <= 5 ? (
                        <Badge bg="warning" text="dark">LOW STOCK</Badge>
                      ) : (
                        <Badge bg="success">STABLE</Badge>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1 align-items-center">
                      <Badge bg={prod.status === 'Active' ? 'success' : prod.status === 'Draft' ? 'secondary' : 'danger'}>
                        {prod.status || 'Active'}
                      </Badge>
                      {prod.featured && <Badge bg="primary">FEATURED</Badge>}
                      {prod.trending && <Badge bg="info" text="dark">TRENDING</Badge>}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center">
                      <Button variant="outline-dark" size="sm" onClick={() => handleOpenEdit(prod)}>
                        <IoPencilOutline size={16} />
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(prod._id)}>
                        <IoTrashOutline size={16} />
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
  );
}
