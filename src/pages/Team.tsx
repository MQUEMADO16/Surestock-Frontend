import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Button, Grid, Avatar, Chip, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  CircularProgress, Alert, Card, CardContent, CardActions, Tooltip, Divider,
  InputAdornment, useTheme
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/models';
import { CreateEmployeeRequest } from '../types/payloads';
import userService from '../services/userService';

const Team = () => {
  const { user: currentUser } = useAuth();
  const theme = useTheme();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isOwner = currentUser?.role === 'OWNER';

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getEmployees();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddMember = async () => {
    if (!newUserEmail || !newUserPassword) return;
    try {
      setDialogLoading(true);
      const payload: CreateEmployeeRequest = {
        email: newUserEmail,
        password: newUserPassword 
      };
      await userService.createEmployee(payload);
      await loadUsers();
      handleCloseDialog();
    } catch (err) {
      console.error(err);
      setError('Failed to add team member.');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewUserEmail('');
    setNewUserPassword('');
    setShowPassword(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this employee? This cannot be undone.')) {
      try {
        await userService.deleteEmployee(id);
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch (err) {
        console.error(err);
        setError('Failed to delete member.');
      }
    }
  };

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  const owner = users.find(u => u.role === 'OWNER');
  const employees = users.filter(u => u.role === 'EMPLOYEE');

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Team</Typography>
          <Typography variant="body2" color="text.secondary">Manage access and roles for your organization.</Typography>
        </Box>
        {isOwner && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenDialog(true)}
            disableElevation
          >
            Add Member
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Owner Card */}
      {owner && (
        <Box mb={4}>
          <Typography variant="subtitle2" fontWeight="600" color="text.secondary" gutterBottom sx={{ ml: 1, mb: 2 }}>
            ADMINISTRATORS
          </Typography>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
                {owner.email.charAt(0).toUpperCase()}
              </Avatar>
              <Box flexGrow={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight="600">{owner.email}</Typography>
                  <Chip label="OWNER" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">Full access to all settings and data.</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Employees Grid */}
      <Box>
        <Typography variant="subtitle2" fontWeight="600" color="text.secondary" gutterBottom sx={{ ml: 1, mb: 2 }}>
          MEMBERS ({employees.length})
        </Typography>
        
        {employees.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa', borderStyle: 'dashed' }}>
            <Typography color="text.secondary">No team members yet.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {employees.map((employee) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={employee.id}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                      <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 56, height: 56, mb: 2, fontSize: '1.25rem' }}>
                          {employee.email.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="600" noWrap sx={{ width: '100%' }}>
                        {employee.email.split('@')[0]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ width: '100%', mb: 1 }}>
                        {employee.email}
                      </Typography>
                      <Chip label="EMPLOYEE" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    </Box>
                  </CardContent>

                  {isOwner && (
                    <>
                      <Divider />
                      <CardActions sx={{ justifyContent: 'center', bgcolor: '#FAFAFA' }}>
                        <Button 
                          size="small" 
                          color="error" 
                          startIcon={<DeleteIcon fontSize="small" />}
                          onClick={() => handleDelete(employee.id)}
                        >
                          Remove
                        </Button>
                      </CardActions>
                    </>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Add Member Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Member</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" icon={<SecurityIcon fontSize="inherit" />}>
              New members will have access to Inventory and Sales immediately.
            </Alert>
            <TextField
              label="Email Address"
              fullWidth
              variant="outlined"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>
              }}
            />
            <TextField
              label="Set Password"
              fullWidth
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={showPassword ? 'Hide' : 'Show'}>
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddMember} 
            disabled={!newUserEmail || !newUserPassword || dialogLoading}
            disableElevation
          >
            {dialogLoading ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Team;