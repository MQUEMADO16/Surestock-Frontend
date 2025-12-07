import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Button, TextField, InputAdornment, 
  IconButton, Grid, Card, CardContent, List, ListItem, 
  ListItemText, Divider, Chip, Alert, CircularProgress, 
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow
} from '@mui/material';
import { 
  Search as SearchIcon, 
  AddShoppingCart as AddCartIcon, 
  Remove as RemoveIcon, 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  ShoppingCartCheckout as CheckoutIcon,
  History as HistoryIcon,
  Receipt as ReceiptIcon,
  Storefront as StoreIcon
} from '@mui/icons-material';

// Import Services & Context
import productService from '../services/productService';
import transactionService from '../services/transactionService';
import businessService from '../services/businessService';

// Import Types
import { Product, TransactionResponse, Business } from '../types/models';
import { SaleRequest } from '../types/payloads';

// --- Types for Local State ---
interface CartItem extends Product {
  cartQuantity: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const CustomTabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && (
        <Box sx={{ height: '100%', p: 2, overflowY: 'auto' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Checkout = () => {
  
  // --- State ---
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [history, setHistory] = useState<TransactionResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [settings, setSettings] = useState<Business | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Load Data ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, settingRes] = await Promise.all([
        productService.getAll(),
        businessService.getSettings()
      ]);
      setProducts(prodRes.data);
      setSettings(settingRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 1) {
      const fetchHistory = async () => {
          setHistoryLoading(true);
          try {
              const res = await transactionService.getHistory();
              setHistory(res.data);
          } catch (err) {
              console.error("Failed to load history", err);
          } finally {
              setHistoryLoading(false);
          }
      };
      fetchHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Cart Logic ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Don't add more than available stock
        if (existing.cartQuantity >= product.quantity) return prev;
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cartQuantity + delta;
        // Clamp between 1 and max stock
        if (newQty < 1) return item; 
        if (newQty > item.quantity) return item; 
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  // --- Calculations ---
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const taxRate = settings?.taxRate || 0;
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  // --- Transaction Submission ---
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      setProcessing(true);
      setError('');
      setSuccessMsg('');

      const payload: SaleRequest = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.cartQuantity
        }))
      };

      await transactionService.createTransaction(payload);
      
      setSuccessMsg(`Sale complete! Total: $${grandTotal.toFixed(2)}`);
      clearCart();
      await loadData(); // Refresh stock levels
    } catch (err) {
      console.error(err);
      setError('Transaction failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // --- Search Filter ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Page Header & Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<StoreIcon />} iconPosition="start" label="New Sale" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="History" />
        </Tabs>
      </Box>

      {/* Feedback Messages */}
      {(error || successMsg) && (
        <Box sx={{ px: 3, mb: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {successMsg && <Alert severity="success" onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
        </Box>
      )}

      {/* --- TAB 1: NEW SALE (Split Screen) --- */}
      <CustomTabPanel value={activeTab} index={0}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          
          {/* LEFT: Product Catalog */}
          <Grid size={{ xs: 12, md: 7, lg: 8}} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                }}
                size="small"
              />
            </Paper>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
              <Grid container spacing={2}>
                {filteredProducts.map((product) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4}} key={product.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.1s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                        cursor: product.quantity > 0 ? 'pointer' : 'not-allowed',
                        opacity: product.quantity > 0 ? 1 : 0.6
                      }}
                      onClick={() => product.quantity > 0 && addToCart(product)}
                    >
                      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold" noWrap title={product.name}>
                            {product.name}
                          </Typography>
                          <Chip 
                            label={product.quantity} 
                            color={product.quantity <= product.reorderThreshold ? 'error' : 'default'} 
                            size="small" 
                            variant={product.quantity === 0 ? 'filled' : 'outlined'}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {product.sku}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          ${product.price.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>

          {/* RIGHT: Cart / Transaction Builder */}
          <Grid size={{ xs: 12, md: 5, lg: 4}} sx={{ height: '100%' }}>
            <Paper 
              elevation={3} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                bgcolor: '#fff'
              }}
            >
              {/* Cart Header */}
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="action" /> Current Sale
                </Typography>
              </Box>

              {/* Cart Items List */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
                {cart.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled', p: 4 }}>
                    <AddCartIcon sx={{ fontSize: 60, mb: 2, opacity: 0.2 }} />
                    <Typography>Cart is empty</Typography>
                    <Typography variant="caption">Click products to add</Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {cart.map((item) => (
                      <React.Fragment key={item.id}>
                        <ListItem
                          secondaryAction={
                            <IconButton edge="end" color="error" onClick={() => removeFromCart(item.id)}>
                              <DeleteIcon />
                            </IconButton>
                          }
                          sx={{ py: 1.5 }}
                        >
                          <ListItemText
                            primary={item.name}
                            secondary={`$${item.price.toFixed(2)} / unit`}
                            primaryTypographyProps={{ fontWeight: 500 }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.cartQuantity <= 1}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography fontWeight="bold" sx={{ minWidth: 20, textAlign: 'center' }}>
                              {item.cartQuantity}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.cartQuantity >= item.quantity}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography fontWeight="bold" sx={{ minWidth: 60, textAlign: 'right' }}>
                            ${(item.price * item.cartQuantity).toFixed(2)}
                          </Typography>
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>

              {/* Cart Footer & Actions */}
              <Box sx={{ p: 3, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography>${subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography color="text.secondary">Tax ({(taxRate * 100).toFixed(0)}%)</Typography>
                  <Typography>${taxAmount.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold">Total</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    ${grandTotal.toFixed(2)}
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <Button 
                      variant="outlined" 
                      color="inherit" 
                      fullWidth 
                      onClick={clearCart}
                      disabled={cart.length === 0 || processing}
                    >
                      Clear
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 8 }}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth 
                      startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <CheckoutIcon />}
                      onClick={handleCheckout}
                      disabled={cart.length === 0 || processing}
                    >
                      {processing ? 'Processing...' : 'Complete Sale'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CustomTabPanel>

      {/* --- TAB 2: HISTORY (Placeholder for now) --- */}
      <CustomTabPanel value={activeTab} index={1}>
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell align="center"><strong>Date & Time</strong></TableCell>
                  <TableCell align="center"><strong>Product Sold (SKU)</strong></TableCell>
                  <TableCell align="center"><strong>Quantity</strong></TableCell>
                  <TableCell align="center"><strong>Sale Total</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No sales history found.</TableCell>
                  </TableRow>
                ) : (
                  history.map((tx) => (
                    <TableRow key={tx.id} hover>
                      <TableCell>#{tx.id}</TableCell>
                      <TableCell align="center">
                        {new Date(tx.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          <Chip label={tx.productSku} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {tx.quantity}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        ${tx.totalPrice.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </CustomTabPanel>
    </Box>
  );
};

export default Checkout;