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
          backgroundColor: '#ffffff', // SaaS White Header
          color: '#1F2937', // Dark Text
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)', // Very subtle shadow
          borderBottom: '1px solid #E5E7EB' // Divider
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
              letterSpacing: '-0.5px',
              color: '#0088FE' // Brand Primary Color for Logo
            }}
          >
            SureStock
          </Typography>
          
          <div>
            <IconButton size="large" onClick={handleMenu} color="inherit">
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: '#0088FE',
                  fontSize: '0.9rem', 
                  fontWeight: 600,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)' // Subtle pop
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

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid #E5E7EB',
            backgroundColor: '#FAFAFA', // Light grey sidebar background
          },
        }}
      >
        <Toolbar /> 
        <Box sx={{ overflow: 'auto', mt: 3 }}>
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 1.5 }}>
                  <ListItemButton 
                    selected={isActive}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 1.5,
                      minHeight: 44,
                      color: isActive ? '#0088FE' : '#4B5563', // Blue active, Dark Grey inactive
                      backgroundColor: isActive ? 'rgba(0, 136, 254, 0.08)' : 'transparent', // Light blue bg active
                      '&:hover': {
                        backgroundColor: isActive ? 'rgba(0, 136, 254, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                        color: isActive ? '#0088FE' : '#111827',
                      },
                      // Left accent border for active state
                      position: 'relative',
                      '&::before': isActive ? {
                        content: '""',
                        position: 'absolute',
                        left: -6, // Push slightly outside padding
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '20px',
                        width: '3px',
                        backgroundColor: '#0088FE',
                        borderRadius: '0 4px 4px 0',
                      } : {},
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

      <Box component="main" sx={{ flexGrow: 1, p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
        <Toolbar /> 
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;