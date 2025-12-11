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

import logo from '../../resources/surestock-logo.png';

const drawerWidth = 260;

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
      
      {/* SIDEBAR (Full Height, Fixed) */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF', // Clean white sidebar
          },
        }}
      >
        {/* Logo Area */}
        <Box sx={{ 
          height: 64, // Matches standard toolbar height
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          px: 2
        }}>
          <img src={logo} style={{ height: '48px' }} alt='SureStock Logo' />
        </Box>

        <Divider sx={{ mb: 2, mx: 4, color: '#000000' }} variant='middle' />

        {/* Navigation Items */}
        <Box sx={{ overflow: 'auto', px: 2 }}>
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton 
                    selected={isActive}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      minHeight: 48,
                      color: isActive ? '#0088FE' : '#6B7280', 
                      backgroundColor: isActive ? 'rgba(0, 136, 254, 0.08)' : 'transparent',
                      '&:hover': {
                        backgroundColor: isActive ? 'rgba(0, 136, 254, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                        color: isActive ? '#0088FE' : '#111827',
                      },
                      justifyContent: 'center', // Centered if collapsed, but we are fixed width
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: 'inherit',
                      minWidth: 40
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.95rem'
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* HEADER (Offset by Drawer Width) */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: `calc(100% - ${drawerWidth}px)`, // Offset width
          ml: `${drawerWidth}px`, // Push to the right
          backgroundColor: '#FFFFFF', // White header
          color: '#1F2937', 
          boxShadow: 'none',
          borderBottom: '1px solid #E5E7EB' 
        }}
      >
        <Toolbar>
          {/* Dynamic Page Title */}
          <Typography variant="h6" fontWeight="600" noWrap component="div" sx={{ flexGrow: 1 }}>
          </Typography>
          
          {/* User Profile Menu */}
          <div>
            <IconButton size="large" onClick={handleMenu} color="inherit">
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: '#0088FE',
                  fontSize: '0.9rem', 
                  fontWeight: 600,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                {user?.email?.[0].toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 3,
                sx: { mt: 1.5, minWidth: 200, borderRadius: 2 }
              }}
            >
              <Box px={2} py={1}>
                <Typography variant="subtitle2" noWrap fontWeight="600">
                  {user?.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main', mt: 1 }}>
                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                Sign Out
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      {/* MAIN CONTENT (Offset by Drawer Width & Toolbar Height) */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          bgcolor: '#F8FAFC', // Light SaaS background
          minHeight: '100vh',
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
        }}
      >
        <Toolbar /> {/* Spacer for the fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;