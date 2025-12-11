import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, TextField, Button, Grid, Divider, Alert, 
  CircularProgress, InputAdornment, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Card, CardContent, CardHeader, useTheme
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Store as StoreIcon,
  AttachMoney as CurrencyIcon,
  LocationOn as LocationIcon,
  Percent as TaxIcon,
  Inventory as StockIcon,
  DeleteForever as DeleteForeverIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Business } from '../types/models';
import { BusinessSettingsUpdate } from '../types/payloads';
import businessService from '../services/businessService';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';

const Settings = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<BusinessSettingsUpdate>({
    name: '',
    currency: '',
    taxRate: 0,
    lowStockThreshold: 0,
    contactAddress: ''
  });

  const isOwner = user?.role === 'OWNER';

  const initializeForm = useCallback((data: Business) => {
    setFormData({
      name: data.name,
      currency: data.currency,
      taxRate: data.taxRate,
      lowStockThreshold: data.lowStockThreshold,
      contactAddress: data.contactAddress || ''
    });
  }, []); 

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await businessService.getSettings();
      setSettings(response.data);
      initializeForm(response.data);
    } catch (err) {
      setError('Failed to load business settings.');
    } finally {
      setLoading(false);
    }
  }, [initializeForm]); 

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await businessService.updateSettings(formData);
      setSettings(response.data); 
      initializeForm(response.data); 
      setIsEditing(false); 
      setError('');
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      initializeForm(settings);
    }
    setIsEditing(false);
    setError('');
  };

  const handleChange = (field: keyof BusinessSettingsUpdate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteBusiness = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete') return;
    try {
      setIsDeleting(true);
      await userService.closeAccount();
      logout(); 
      navigate('/login'); 
    } catch (err) {
      setError('Failed to delete business. Please try again.');
      setOpenDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Settings</Typography>
          <Typography variant="body2" color="text.secondary">Manage your business profile and preferences.</Typography>
        </Box>
        
        {isOwner && (
          <Box>
            {!isEditing ? (
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />} 
                onClick={() => setIsEditing(true)}
              >
                Edit Settings
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="text" 
                  color="inherit" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} 
                  onClick={handleSave}
                  disabled={saving}
                >
                  Save Changes
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Main Settings Card */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardHeader 
          title="General Information" 
          subheader="Basic details about your store visible on receipts and invoices."
          titleTypographyProps={{ fontWeight: 600, fontSize: '1.1rem' }}
        />
        <Divider />
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Business Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Business Name"
                fullWidth
                value={isEditing ? formData.name : settings?.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><StoreIcon color="action" /></InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Contact Address */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Contact Address"
                fullWidth
                value={isEditing ? formData.contactAddress : (settings?.contactAddress || '')}
                onChange={(e) => handleChange('contactAddress', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><LocationIcon color="action" /></InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader 
          title="Configuration & Defaults" 
          subheader="Set up your financial and inventory defaults."
          titleTypographyProps={{ fontWeight: 600, fontSize: '1.1rem' }}
        />
        <Divider />
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Currency */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Currency Code"
                fullWidth
                value={isEditing ? formData.currency : settings?.currency}
                onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
                disabled={!isEditing}
                helperText="ISO Code (e.g. USD, EUR)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><CurrencyIcon color="action" /></InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Tax Rate */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Default Tax Rate"
                type="number"
                fullWidth
                value={isEditing ? formData.taxRate : settings?.taxRate}
                onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><TaxIcon color="action" /></InputAdornment>
                  ),
                  inputProps: { step: 0.01, min: 0 }
                }}
                helperText={isEditing ? "Enter as decimal (0.08 = 8%)" : `${((settings?.taxRate || 0) * 100).toFixed(0)}%`}
              />
            </Grid>

            {/* Low Stock Threshold */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Global Low Stock Alert"
                type="number"
                fullWidth
                value={isEditing ? formData.lowStockThreshold : settings?.lowStockThreshold}
                onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
                disabled={!isEditing}
                helperText="Default threshold for new products"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><StockIcon color="action" /></InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Danger Zone */}
      {isOwner && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" color="error" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem', fontWeight: 600 }}>
            <WarningIcon fontSize="small" /> Danger Zone
          </Typography>
          <Card variant="outlined" sx={{ borderColor: theme.palette.error.light, bgcolor: '#FEF2F2' }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">Delete Business Account</Typography>
                <Typography variant="body2" color="text.secondary">
                  Permanently delete your business account and all associated data. This cannot be undone.
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteForeverIcon />}
                onClick={() => {
                  setDeleteConfirmation('');
                  setOpenDeleteDialog(true);
                }}
              >
                Delete Business
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon /> Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This action will wipe all <strong>products</strong>, <strong>transactions</strong>, and <strong>employee accounts</strong> immediately.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Type 'delete' to confirm"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            color="error"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            disabled={deleteConfirmation.toLowerCase() !== 'delete' || isDeleting}
            onClick={handleDeleteBusiness}
          >
            {isDeleting ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;