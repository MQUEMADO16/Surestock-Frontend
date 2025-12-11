import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Container, Paper, TextField, Button, Typography, Box, Alert, Tab, Tabs, InputAdornment, Tooltip, IconButton, Card, CardContent
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Store } from '@mui/icons-material';
import authService from '../services/authService';

// Using the SVG component instead of the image file
import SureStockLogo from '../resources/surestock-logo.png'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState(''); // Only for Register
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await authService.register({
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
        if(err.response) {
            setError(err.response.data.message || 'Authentication failed');
        } else {
            setError('Network error. Is backend running?');
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#F3F4F6', // Light SaaS background
        p: 2
      }}
    >
      <Container maxWidth="xs">
        <Box sx={{ textAlign: 'center', mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Logo Section */}
          <img src={SureStockLogo} alt='SureStock logo' style={{ height: 160, marginBottom: 16 }}/>
          <Typography variant="h5" fontWeight="700" color="text.primary">
            {isLogin ? 'Sign in to your account' : 'Create your store'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            {isLogin 
              ? 'Welcome back! Please enter your details.' 
              : 'Start managing your inventory in minutes.'}
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
          <CardContent sx={{ p: 4 }}>
            <Tabs 
              value={isLogin ? 0 : 1} 
              onChange={(_, val) => { setIsLogin(val === 0); setError(''); }}
              variant="fullWidth"
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <TextField
                  label="Business Name"
                  fullWidth
                  margin="normal"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Store color="action" /></InputAdornment>,
                  }}
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
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment>,
                }}
              />
              
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
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
                }}
              />
              
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, height: 48, fontSize: '1rem' }}
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Footer Link */}
        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Button 
              color="primary" 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              sx={{ textTransform: 'none', fontWeight: 600, p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </Button>
          </Typography>
        </Box>

      </Container>
    </Box>
  );
};

export default Login;