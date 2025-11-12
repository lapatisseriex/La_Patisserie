import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';

/**
 * Custom hook for managing stock operations
 */
export const useStock = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get stock status for a product (matches backend /api/stock/:productId)
  const getStockStatus = async (productId) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiService.get(`/stock/${productId}`);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update stock for a specific variant
  const updateStock = async (productId, variantIndex, stock, isStockActive) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiService.put(`/stock/${productId}/variant/${variantIndex}`, {
        stock: parseInt(stock),
        isStockActive: Boolean(isStockActive)
      });
      toast.success('Stock updated successfully');
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get inventory overview
  const getInventoryOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiService.get('/stock-validation/inventory/overview');
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get low stock products
  const getLowStockProducts = async (threshold = 5) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiService.get('/stock-validation/inventory/low-stock', { params: { threshold } });
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Bulk update stock
  const bulkUpdateStock = async (updates) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiService.put('/stock-validation/inventory/bulk-update', { updates });
      toast.success(`Updated ${data.results.length} items successfully`);
      if (data.errors && data.errors.length > 0) {
        toast.warning(`${data.errors.length} items failed to update`);
      }
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generate inventory report
  const generateInventoryReport = async (categoryId = null) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiService.get('/stock-validation/inventory/report', {
        params: categoryId ? { categoryId } : undefined});
      return data.report;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Download inventory report as JSON
  const downloadInventoryReport = async (categoryId = null) => {
    try {
      const report = await generateInventoryReport(categoryId);
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  // Set stock alerts
  const setStockAlerts = async (productId, variantIndex, lowStockThreshold, outOfStockAlert) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiService.put('/stock-validation/inventory/alerts', {
        productId,
        variantIndex,
        lowStockThreshold,
        outOfStockAlert});
      toast.success('Stock alerts updated successfully');
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get stock activity/history
  const getStockActivity = async (productId = null, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      const params = { limit };
      if (productId) params.productId = productId;
      const { data } = await apiService.get('/stock-validation/inventory/activity', { params });
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getStockStatus,
    updateStock,
    getInventoryOverview,
    getLowStockProducts,
    bulkUpdateStock,
    generateInventoryReport,
    downloadInventoryReport,
    setStockAlerts,
    getStockActivity
  };
};

export default useStock;