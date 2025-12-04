import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Button, Grid, Avatar, Chip, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  CircularProgress, Alert, Card, CardContent, CardActions, Tooltip, Divider,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/models';
import { CreateEmployeeRequest } from '../types/payloads';
import userService from '../services/userService';

const Team = () => {
  const { user: currentUser } = useAuth();
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
    if (!newUserEmail || !newUserPassword) return; // Ensure both fields are filled
    try {
      setDialogLoading(true);
      
      const payload: CreateEmployeeRequest = {
        email: newUserEmail,
        password: newUserPassword 
      };

      await userService.createEmployee(payload);
      await loadUsers(); // Refresh list
      
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
    setShowPassword(false); // Reset visibility state
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
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

  // Filter users based on role
  const owner = users.find(u => u.role === 'OWNER');
  const employees = users.filter(u => u.role === 'EMPLOYEE');

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">Team Overview</Typography>
        {isOwner && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenDialog(true)}
          >
            Add Employee
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Leadership Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon color="primary" /> Leadership
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {owner && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderLeft: '6px solid #1976d2',
            display: 'flex', 
            alignItems: 'center',
            gap: 3,
            background: 'linear-gradient(to right, #f5faff, #ffffff)'
          }}
        >
          <Avatar 
            sx={{ width: 64, height: 64, bgcolor: '#1976d2', fontSize: '2rem', }}
          >
            {owner.email.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="500">Business Owner</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, color: 'text.secondary' }}>
              <EmailIcon fontSize="small"/>
              <Typography variant="body1">{owner.email}</Typography>
              <Chip label="OWNER" size="small" color="primary" sx={{ ml: 1, fontWeight: 'bold' }} />
            </Box>
          </Box>
        </Paper>
      )}

      {/* Employees Section */}
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BadgeIcon color="action" /> Team Members ({employees.length})
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {employees.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa' }}>
          <Typography color="text.secondary">No employees found. Add members to your team.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {employees.map((employee) => (
            <Grid size={{xs: 12, md: 6, lg: 4}} key={employee.id}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'orange' }}>
                        {employee.email.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {employee.email.split('@')[0]}
                      </Typography>
                      <Chip label="EMPLOYEE" size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                    <EmailIcon fontSize="small" sx={{ opacity: 0.7 }} />
                    <Typography variant="body2" noWrap>{employee.email}</Typography>
                  </Box>
                </CardContent>

                {/* Only Owners see actions */}
                {isOwner && (
                  <CardActions sx={{ justifyContent: 'flex-end', bgcolor: '#fafafa', borderTop: '1px solid #eee' }}>
                    <Tooltip title="Remove Member">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDelete(employee.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Member Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Enter the credentials for the new employee.
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
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                  endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={showPassword ? 'Hide' : 'Show'}>
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                  )
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddMember} 
            disabled={!newUserEmail || !newUserPassword || dialogLoading}
          >
            {dialogLoading ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Team;