import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Divider 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Inventory as InventoryIcon, 
  ShoppingCart as SalesIcon, 
  Assessment as ReportsIcon, 
  Group as TeamIcon, 
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Menu items config
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Sales', icon: <SalesIcon />, path: '/checkout' },
    { text: 'Analytics', icon: <ReportsIcon />, path: '/analytics' },
    { text: 'Team', icon: <TeamIcon />, path: '/team' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
  ];

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Top App Bar with Depth */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#ffffff', // Deep Blue
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)', // Adds depth/shadow below header
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)' // Subtle divider
        }}
      >
        <Toolbar>
          <Typography 
            variant="h5" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center', 
              fontWeight: 700, 
              letterSpacing: '0.5px'
            }}
            ml='10px'
            color='#1d407c'
            mt='5px'
            marginLeft='10px'
          >
            SureStock
          </Typography>
          
          <div>
            <IconButton size="large" onClick={handleMenu} color="inherit">
              <Avatar 
                sx={{ 
                  width: 38, 
                  height: 38, 
                  bgcolor: '#1976d2',
                  color: '#ffffff',
                  fontSize: '1.4rem', 
                  fontWeight: 500,
                  pt: '4px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)' // Pop the avatar
                }}
              >
                {user?.email?.[0].toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 3,
                sx: { mt: 1.5, minWidth: 180 }
              }}
            >
              <MenuItem disabled sx={{ opacity: 1, color: 'text.primary', fontWeight: 600 }}>
                {user?.email}
              </MenuItem>
              <MenuItem disabled sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                Role: {user?.role}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer with Border and Active States */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid #E0E0E0', // Clean separation
            backgroundColor: '#FAFAFA', // Slightly off-white for contrast
          },
        }}
      >
        <Toolbar /> 
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    selected={isActive}
                    onClick={() => navigate(item.path)}
                    sx={{
                      mx: 1,
                      borderRadius: 1,
                      backgroundColor: isActive ? 'rgba(62, 107, 142, 0.08)' : 'transparent', // Light blue bg when active
                      borderLeft: isActive ? '4px solid #3E6B8E' : '4px solid transparent', // Left accent bar
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(62, 107, 142, 0.12)',
                        '&:hover': { backgroundColor: 'rgba(62, 107, 142, 0.18)' }
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: isActive ? 'primary.main' : 'text.secondary',
                      minWidth: 40
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'primary.main' : 'text.primary'
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#F3F4F6', minHeight: '100vh' }}>
        <Toolbar /> 
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;