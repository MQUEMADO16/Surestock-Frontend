import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Button, TextField, InputAdornment, 
  IconButton, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Tooltip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Grid, Alert, CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Inventory as InventoryIcon, 
  SwapVert as StockIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types/models';
import { CreateProductRequest, UpdateProductDetailsRequest } from '../types/payloads';
import productService from '../services/productService';
import businessService from '../services/businessService';

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [defaultThreshold, setDefaultThreshold] = useState<number>(5);

  // Dialog States
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  
  // Selected Item State (for Edit/Stock Update)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form Data State
  const [productForm, setProductForm] = useState<CreateProductRequest>({
    name: '', sku: '', price: 0, cost: 0, quantity: 0, reorderThreshold: 5
  });
  const [stockAdjustment, setStockAdjustment] = useState<number | ''>('');

  const isOwner = user?.role === 'OWNER';

  // --- Data Loading ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Parallel fetch for products and settings
      const [productsRes, settingsRes] = await Promise.all([
        productService.getAll(),
        businessService.getSettings()
      ]);
      
      setProducts(productsRes.data);
      // settingsRes.data might be undefined if the service mock fails or returns differently,
      // so we add a safe check or default.
      if (settingsRes && settingsRes.data) {
          setDefaultThreshold(settingsRes.data.lowStockThreshold);
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load inventory data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Search Logic ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Handlers ---

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setProductForm({ 
      name: '', 
      sku: '', 
      price: 0, 
      cost: 0, 
      quantity: 0, 
      reorderThreshold: defaultThreshold 
    });
    setOpenProductDialog(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      cost: product.cost,
      quantity: product.quantity, 
      reorderThreshold: product.reorderThreshold
    });
    setOpenProductDialog(true);
  };

  const handleOpenStock = (product: Product) => {
    setSelectedProduct(product);
    setStockAdjustment('');
    setOpenStockDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  const submitProductForm = async () => {
    try {
      setDialogLoading(true);
      if (selectedProduct) {
        // Edit Mode (Update Details)
        const payload: UpdateProductDetailsRequest = {
          name: productForm.name,
          sku: productForm.sku,
          price: Number(productForm.price),
          cost: Number(productForm.cost),
          reorderThreshold: Number(productForm.reorderThreshold)
        };
        const res = await productService.updateDetails(selectedProduct.id, payload);
        
        // Update local state
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? res.data : p));
      } else {
        // Create Mode
        const res = await productService.create(productForm);
        setProducts(prev => [...prev, res.data]);
      }
      setOpenProductDialog(false);
    } catch (err) {
      console.error(err);
      alert('Operation failed. Please check inputs.');
    } finally {
      setDialogLoading(false);
    }
  };

  const submitStockUpdate = async () => {
    if (!selectedProduct || stockAdjustment === '' || stockAdjustment === 0) return;
    try {
      setDialogLoading(true);
      const res = await productService.updateStock(selectedProduct.id, { 
        quantityChange: Number(stockAdjustment) 
      });
      
      // Update local state
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? res.data : p));
      setOpenStockDialog(false);
    } catch (err) {
      alert('Failed to update stock. Ensure you do not have negative stock.');
    } finally {
      setDialogLoading(false);
    }
  };

  // --- Render Helpers ---
  const isLowStock = (p: Product) => p.quantity <= p.reorderThreshold;

  return (
    <Box>
      {/* Header & Actions */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" fontWeight="600" color="primary">Inventory</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
            }}
            sx={{ bgcolor: 'white', borderRadius: 1 }}
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreate}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Product
          </Button>
          <IconButton onClick={loadData} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Products Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Product Name</strong></TableCell>
              <TableCell><strong>SKU</strong></TableCell>
              <TableCell align="right"><strong>Price</strong></TableCell>
              <TableCell align="center"><strong>Quantity</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="500">{product.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={product.sku} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                  </TableCell>
                  <TableCell align="right">${product.price.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Typography 
                      color={isLowStock(product) ? 'error.main' : 'text.primary'}
                    >
                      {product.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {isLowStock(product) ? (
                      <Chip icon={<WarningIcon />} label="Low Stock" color="error" size="small" />
                    ) : (
                      <Chip label="In Stock" color="success" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Update Stock">
                      <IconButton color="primary" onClick={() => handleOpenStock(product)}>
                        <StockIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Details">
                      <IconButton onClick={() => handleOpenEdit(product)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {isOwner && (
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDelete(product.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog 1: Create / Edit Product */}
      <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Product Name"
              fullWidth
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            />
            <TextField
              label="SKU"
              fullWidth
              value={productForm.sku}
              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid size={{xs: 6}}>
                <TextField
                  label="Retail Price"
                  type="number"
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                />
              </Grid>
              <Grid size={{xs: 6}}>
                <TextField
                  label="Wholesale Cost"
                  type="number"
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  value={productForm.cost}
                  onChange={(e) => setProductForm({ ...productForm, cost: parseFloat(e.target.value) })}
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid size={{xs: 6}}>
                <TextField
                  label={selectedProduct ? "Current Quantity (Read-only)" : "Initial Quantity"}
                  type="number"
                  fullWidth
                  disabled={!!selectedProduct} // Disable quantity edit here (force them to use stock adjust)
                  value={productForm.quantity}
                  onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid size={{xs: 6}}>
                <TextField
                  label="Reorder Threshold"
                  type="number"
                  fullWidth
                  value={productForm.reorderThreshold}
                  onChange={(e) => setProductForm({ ...productForm, reorderThreshold: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitProductForm} disabled={dialogLoading}>
            {dialogLoading ? 'Saving...' : 'Save Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog 2: Quick Stock Adjustment */}
      <Dialog open={openStockDialog} onClose={() => setOpenStockDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Update quantity for <strong>{selectedProduct?.name}</strong>.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <InventoryIcon color="action" />
              <Typography variant="h6">Current: {selectedProduct?.quantity}</Typography>
            </Box>
            
            <TextField
              label="Quantity Change"
              type="number"
              fullWidth
              autoFocus
              placeholder="e.g. 5 or -2"
              value={stockAdjustment}
              onChange={(e) => setStockAdjustment(parseInt(e.target.value))}
              helperText="Positive to add, Negative to remove"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStockDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitStockUpdate} disabled={dialogLoading || stockAdjustment === ''}>
            {dialogLoading ? 'Updating...' : 'Update Stock'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Inventory;