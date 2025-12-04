import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, Grid, Divider, Alert, 
  CircularProgress, InputAdornment, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
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
  const { user, logout } = useAuth(); // Assuming logout is available in AuthContext
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  
  // Delete Dialog State
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Typed form data based on your Payloads.ts
  const [formData, setFormData] = useState<BusinessSettingsUpdate>({
    name: '',
    currency: '',
    taxRate: 0,
    lowStockThreshold: 0,
    contactAddress: ''
  });

  const isOwner = user?.role === 'OWNER';

  // Initialize form with data from the API
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
      // Service call matches the BusinessSettingsUpdate payload structure
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
      // Logout and redirect to login page after successful deletion
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
    <Box sx={{ pb: 8 }} maxHeight='600px'>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600" color="primary">Business Settings</Typography>
        
        {isOwner && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!isEditing ? (
              <Button 
                variant="contained" 
                startIcon={<EditIcon />} 
                onClick={() => setIsEditing(true)}
              >
                Edit Settings
              </Button>
            ) : (
              <>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  startIcon={<CancelIcon />} 
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
              </>
            )}
          </Box>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          General Information
        </Typography>
        <Divider sx={{ mb: 4 }} />
        
        {/* Main Grid Container */}
        <Grid container spacing={3}>
          
          {/* Business Name - Now Editable */}
          <Grid size={{xs: 12, md: 6}}>
            <TextField
              label="Business Name"
              fullWidth
              value={isEditing ? formData.name : settings?.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={!isEditing}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <StoreIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Contact Address */}
          <Grid size={{xs: 12, md: 6}}>
            <TextField
              label="Contact Address"
              fullWidth
              value={isEditing ? formData.contactAddress : (settings?.contactAddress || '')}
              onChange={(e) => handleChange('contactAddress', e.target.value)}
              disabled={!isEditing}
              multiline
              rows={1}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start' }}>
                    <LocationIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* New Section Divider */}
          <Grid size={{xs: 12}}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Configuration & Defaults
              </Typography>
              <Divider />
            </Box>
          </Grid>

          {/* Currency */}
          <Grid size={{xs: 12, md: 4}}>
            <TextField
              label="Currency Code"
              fullWidth
              value={isEditing ? formData.currency : settings?.currency}
              onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
              disabled={!isEditing}
              helperText="ISO Code (e.g. USD, EUR)"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Tax Rate */}
          <Grid size={{xs: 12, md: 4}}>
            <TextField
              label="Default Tax Rate"
              type="number"
              fullWidth
              value={isEditing ? formData.taxRate : settings?.taxRate}
              onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
              disabled={!isEditing}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TaxIcon color="action" />
                  </InputAdornment>
                ),
                inputProps: { step: 0.01, min: 0 }
              }}
              helperText={
                isEditing 
                  ? "Enter as decimal (0.08 = 8%)" 
                  : `Calculated as ${(settings?.taxRate || 0) * 100}%`
              }
            />
          </Grid>

          {/* Low Stock Threshold */}
          <Grid size={{xs: 12, md: 4}}>
            <TextField
              label="Default Low Stock Alert"
              type="number"
              fullWidth
              value={isEditing ? formData.lowStockThreshold : settings?.lowStockThreshold}
              onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
              disabled={!isEditing}
              helperText="Units remaining"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <StockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

        </Grid>
      </Paper>
      
      {/* Danger Zone - Only for Owners */}
      {isOwner && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            border: '1px solid #c22222ff', 
            bgcolor: '#fff5f5',
            borderRadius: 2,
            mt: 10
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#c22222ff' }} mt='2'>
            <WarningIcon />
            <Typography variant="h6" fontWeight="bold">Danger Zone</Typography>
          </Box>
          <Divider sx={{ mb: 3, borderColor: '#ffcdd2' }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Delete Business Account</Typography>
              <Typography variant="body2" color="text.secondary">
                Permanently delete your business account and all associated data (inventory, sales, employees). 
                This action cannot be undone.
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
          </Box>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#c22222ff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon /> Delete Business Permanently?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            This action creates an <strong>atomic deletion</strong> of your entire tenant. 
            All products, transaction history, and employee accounts will be wiped from the database immediately.
            <br /><br />
            Please type <strong>delete</strong> to confirm.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            placeholder="Type 'delete' to confirm"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            error={deleteConfirmation.length > 0 && deleteConfirmation.toLowerCase() !== 'delete'}
            color="error"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            disabled={deleteConfirmation.toLowerCase() !== 'delete' || isDeleting}
            onClick={handleDeleteBusiness}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteForeverIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;