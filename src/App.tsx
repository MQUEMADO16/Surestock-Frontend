import React, { JSX } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Settings from './pages/Settings';
import MainLayout from './components/layout/MainLayout';
import { Typography } from '@mui/material';

// Guard Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>; 
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Guard
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

// Placeholder Pages (We will build these out individually later)
const Dashboard = () => <Typography variant="h4">Dashboard Overview</Typography>;
const Inventory = () => <Typography variant="h4">Inventory Management</Typography>;
const Checkout = () => <Typography variant="h4">Sales & Checkout</Typography>;
const Reports = () => <Typography variant="h4">Analytics & Reports</Typography>;
const Team = () => <Typography variant="h4">Team Management</Typography>;

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        {/* Protected Area with Layout */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;