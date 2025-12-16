import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Button, TextField, InputAdornment, 
  IconButton, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Tooltip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Divider, Grid, Alert, CircularProgress,
  Tabs, Tab, Menu, MenuItem, ListItemIcon, ListItemText, useTheme
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Inventory as InventoryIcon,
  SwapVert as StockIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types/models';
import { CreateProductRequest, UpdateProductDetailsRequest } from '../types/payloads';
import productService from '../services/productService';
import businessService from '../services/businessService';

type FilterStatus = 'ALL' | 'LOW' | 'OUT';

const Inventory = () => {
  const { user } = useAuth();
  const theme = useTheme();
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [defaultThreshold, setDefaultThreshold] = useState<number>(5);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null
  });

  // Action Menu State
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuProductId, setMenuProductId] = useState<number | null>(null);

  // Dialog States
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  
  // Validation State
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<CreateProductRequest>({
    name: '', sku: '', price: 0, cost: 0, quantity: 0, reorderThreshold: 5
  });
  const [stockAdjustment, setStockAdjustment] = useState<number | ''>('');

  const isOwner = user?.role === 'OWNER';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, settingsRes] = await Promise.all([
        productService.getAll(),
        businessService.getSettings()
      ]);
      
      setProducts(productsRes.data);
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

  // --- Filtering Logic ---
  const getStatus = (p: Product) => {
    if (p.quantity === 0) return 'OUT';
    if (p.quantity <= p.reorderThreshold) return 'LOW';
    return 'OK';
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'LOW') return getStatus(p) === 'LOW' || getStatus(p) === 'OUT'; 
    if (filterStatus === 'OUT') return getStatus(p) === 'OUT';
    
    return true;
  });

  // --- Sorting Logic ---
  const sortedProducts = React.useMemo(() => {
    const { key, direction } = sortConfig;
    if (!key || !direction) return filteredProducts;

    return [...filteredProducts].sort((a, b) => {
      const valA = a[key as keyof Product];
      const valB = b[key as keyof Product];

      if (valA == null && valB == null) return 0;
      if (valA == null) return direction === 'asc' ? -1 : 1;
      if (valB == null) return direction === 'asc' ? 1 : -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortConfig]);

  // --- Handlers ---

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, productId: number) => {
    setMenuAnchor(event.currentTarget);
    setMenuProductId(productId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuProductId(null);
  };

  const handleMenuAction = (action: 'edit' | 'delete') => {
    const product = products.find(p => p.id === menuProductId);
    if (!product) return;

    if (action === 'edit') handleOpenEdit(product);
    if (action === 'delete') handleDelete(product.id);
    
    handleMenuClose();
  };

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormErrors({}); // Clear errors
    setProductForm({ 
      name: '', sku: '', price: 0, cost: 0, quantity: 0, reorderThreshold: defaultThreshold 
    });
    setOpenProductDialog(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormErrors({}); // Clear errors
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

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null };
    });
  };

  // --- Validation Logic ---
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    if (!productForm.name.trim()) {
      errors.name = 'Product name is required';
      isValid = false;
    }

    if (!productForm.sku.trim()) {
      errors.sku = 'SKU is required';
      isValid = false;
    }

    if (productForm.price < 0) {
      errors.price = 'Price cannot be negative';
      isValid = false;
    }

    if (productForm.cost < 0) {
      errors.cost = 'Cost cannot be negative';
      isValid = false;
    }
    
    // Only check initial quantity for new products (as it's read-only for edits)
    if (!selectedProduct && productForm.quantity < 0) {
        errors.quantity = 'Quantity cannot be negative';
        isValid = false;
    }

    if (productForm.reorderThreshold < 0) {
        errors.reorderThreshold = 'Threshold cannot be negative';
        isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const submitProductForm = async () => {
    if (!validateForm()) return; // Stop if validation fails

    try {
      setDialogLoading(true);
      if (selectedProduct) {
        const payload: UpdateProductDetailsRequest = {
          name: productForm.name,
          sku: productForm.sku,
          price: Number(productForm.price),
          cost: Number(productForm.cost),
          reorderThreshold: Number(productForm.reorderThreshold)
        };
        const res = await productService.updateDetails(selectedProduct.id, payload);
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? res.data : p));
      } else {
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
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? res.data : p));
      setOpenStockDialog(false);
    } catch (err) {
      alert('Failed to update stock. Ensure you do not have negative stock.');
    } finally {
      setDialogLoading(false);
    }
  };

  // --- Render Helpers ---
  const renderSortArrow = (column: string) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Helper to safely render hex colors with opacity
  const alpha = (color: string, opacity: number) => {
    // Basic implementation assuming theme provides hex codes
    // For production, consider using @mui/material/styles alpha utility
    return color; 
  };

  return (
    <Box sx={{ maxWidth: 1600, margin: '0 auto', p: 3 }}>
      
      {/* Header Section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Inventory</Typography>
          <Typography variant="body2" color="text.secondary">Manage your product catalog and stock levels.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={loadData}
          >
            Sync
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreate}
            disableElevation
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Filter Tabs & Search Bar */}
      <Paper variant="outlined" sx={{ mb: 3, p: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Tabs 
          value={filterStatus} 
          onChange={(_, val) => setFilterStatus(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ minHeight: 'unset' }}
        >
          <Tab value="ALL" label="All Products" sx={{ textTransform: 'none', minHeight: 40, fontWeight: 600 }} />
          <Tab value="LOW" icon={<WarningIcon fontSize="small" color="warning"/>} iconPosition="start" label="Low Stock" sx={{ textTransform: 'none', minHeight: 40, fontWeight: 600 }} />
          <Tab value="OUT" icon={<WarningIcon fontSize="small" color="error"/>} iconPosition="start" label="Out of Stock" sx={{ textTransform: 'none', minHeight: 40, fontWeight: 600 }} />
        </Tabs>

        <TextField
          size="small"
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>
          }}
          sx={{ width: { xs: '100%', md: 300 } }}
        />
      </Paper>

      {/* Main Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F9FAFB' }}>
              <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Product Name {renderSortArrow('name')}
              </TableCell>
              <TableCell onClick={() => handleSort('sku')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                SKU {renderSortArrow('sku')}
              </TableCell>
              <TableCell onClick={() => handleSort('price')} align="right" sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Price {renderSortArrow('price')}
              </TableCell>
              <TableCell onClick={() => handleSort('quantity')} align="right" sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Quantity {renderSortArrow('quantity')}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  <InventoryIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                  <Typography>No products match your filters.</Typography>
                  <Button size="small" onClick={() => {setFilterStatus('ALL'); setSearchQuery('')}} sx={{ mt: 1 }}>
                    Clear Filters
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts.map((product) => {
                const status = getStatus(product);
                return (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">{product.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f3f4f6', px: 1, py: 0.5, borderRadius: 1 }}>
                        {product.sku}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">${product.price.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={status !== 'OK' ? 'bold' : 'normal'} color={status !== 'OK' ? 'error.main' : 'inherit'}>
                        {product.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {status === 'OUT' && <Chip label="Out of Stock" color="error" size="small" />}
                      {status === 'LOW' && <Chip label="Low Stock" color="warning" size="small" />}
                      {status === 'OK' && <Chip label="In Stock" color="success" variant="outlined" size="small" />}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Quick Update">
                        <IconButton size="small" color="primary" onClick={() => handleOpenStock(product)} sx={{ mr: 1 }}>
                          <StockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, product.id)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu (Edit/Delete) */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 150, boxShadow: theme.shadows[3] } }}
      >
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Details</ListItemText>
        </MenuItem>
        {isOwner && (
          <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Dialog 1: Create / Edit Product */}
      <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Product Name"
                  fullWidth
                  required
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="SKU"
                  fullWidth
                  required
                  error={!!formErrors.sku}
                  helperText={formErrors.sku}
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Retail Price"
                  type="number"
                  fullWidth
                  error={!!formErrors.price}
                  helperText={formErrors.price}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Wholesale Cost"
                  type="number"
                  fullWidth
                  error={!!formErrors.cost}
                  helperText={formErrors.cost}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  value={productForm.cost}
                  onChange={(e) => setProductForm({ ...productForm, cost: parseFloat(e.target.value) })}
                />
              </Grid>
            </Grid>
            
            <Divider textAlign="left"><Typography variant="caption" color="textSecondary">INVENTORY SETTINGS</Typography></Divider>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label={selectedProduct ? "Current Qty (Read-only)" : "Initial Qty"}
                  type="number"
                  fullWidth
                  disabled={!!selectedProduct}
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity}
                  value={productForm.quantity}
                  onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Reorder Threshold"
                  type="number"
                  fullWidth
                  error={!!formErrors.reorderThreshold}
                  value={productForm.reorderThreshold}
                  onChange={(e) => setProductForm({ ...productForm, reorderThreshold: parseInt(e.target.value) })}
                  helperText={formErrors.reorderThreshold || "Alert when stock falls below this"}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenProductDialog(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={submitProductForm} disabled={dialogLoading}>
            {dialogLoading ? 'Saving...' : 'Save Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog 2: Quick Stock Adjustment */}
      <Dialog open={openStockDialog} onClose={() => setOpenStockDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Stock Level</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" icon={<InventoryIcon />}>
              Current Stock: <strong>{selectedProduct?.quantity}</strong>
            </Alert>
            <Typography variant="body2">
              Enter the amount to <strong>add</strong> (positive) or <strong>remove</strong> (negative).
            </Typography>
            <TextField
              label="Quantity Change"
              type="number"
              fullWidth
              autoFocus
              value={stockAdjustment}
              onChange={(e) => setStockAdjustment(parseInt(e.target.value))}
              InputProps={{
                endAdornment: <InputAdornment position="end">units</InputAdornment>
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenStockDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitStockUpdate} disabled={dialogLoading || stockAdjustment === ''}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Inventory;