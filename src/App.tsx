import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

function App() {
  return (
    <Box sx={{ p: 4 }}>
      <Routes>
        <Route path="/" element={<Typography variant="h3">SureStock Frontend</Typography>} />
      </Routes>
    </Box>
  );
}

export default App;