import React, { JSX } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import { Box, Typography } from '@mui/material';

// Protected Route: Only allows access if logged IN
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>; 
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route: Only allows access if logged OUT (Redirects to dashboard if logged in)
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

// Placeholder for Dashboard
const Dashboard = () => (
  <Box sx={{ p: 4 }}>
    <Typography variant="h3">Main Dashboard</Typography>
    <Typography>You are logged in!</Typography>
  </Box>
);

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Wrap Login in PublicRoute so logged-in users get bounced to dashboard */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;