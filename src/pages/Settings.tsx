import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, Grid, Divider, Alert, 
  CircularProgress, InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  Store as StoreIcon,
  AttachMoney as CurrencyIcon,
  LocationOn as LocationIcon,
  Percent as TaxIcon,
  Inventory as StockIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Business } from '../types/models';
import { BusinessSettingsUpdate } from '../types/payloads';
import businessService from '../services/businessService';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  
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

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
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
    </Box>
  );
};

export default Settings;