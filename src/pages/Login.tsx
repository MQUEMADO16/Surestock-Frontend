import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Container, Paper, TextField, Button, Typography, Box, Alert, Tab, Tabs 
} from '@mui/material';
import api from '../services/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState(''); // Only for Register
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        // Register Flow
        await api.post('/auth/register', {
          email,
          password,
          role: 'OWNER',
          businessName
        });
        // Auto-login after register
        await login({ email, password });
      }
      navigate('/dashboard'); // Redirect on success
    } catch (err: any) {
        // Simple error handling
        if(err.response) {
            setError(err.response.data.message || 'Authentication failed');
        } else {
            setError('Network error. Is backend running?');
        }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default' // Use theme background color
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>SureStock</Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {isLogin ? 'Welcome Back' : 'Start Your Business'}
            </Typography>
          </Box>

          <Tabs 
            value={isLogin ? 0 : 1} 
            onChange={(_, val) => { setIsLogin(val === 0); setError(''); }}
            centered 
            sx={{ mb: 3 }}
          >
            <Tab label="Login" />
            <Tab label="Register Owner" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <TextField
                label="Business Name"
                fullWidth
                margin="normal"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            )}
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              size="large"
              sx={{ mt: 3 }}
            >
              {isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;