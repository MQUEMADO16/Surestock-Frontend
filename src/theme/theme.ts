import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      // A professional, steel-blue tone.
      main: '#2d83c5ff', 
      light: '#62aaeeff', // Lighter variant for hovers/accents
      dark: '#1d407c',  // Darker variant for active states
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c22222ff', // Softer red for secondary actions or alerts (like the "Low Stock" highlight)
    },
    background: {
      default: '#F4F6F8', // The light grey background seen in dashboard apps
      paper: '#FFFFFF',   // White background for Cards and Modals
    },
    text: {
      primary: '#1F2937', // Dark grey/black for better readability than pure black
      secondary: '#6B7280', // Muted grey for subtitles
    },
  },
  components: {
    // Override Card style to match the clean dashboard look
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)', // Subtle shadow
          borderRadius: '8px',
          border: '1px solid #E5E7EB', // Very subtle border
        },
      },
    },
    // Customize the Top Navigation Bar (AppBar)
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1d407c', // Uses the darker variant for the header to ground the page
          boxShadow: 'none',
        },
      },
    },
    // Customize Buttons to be slightly rounder and flatter
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevents ALL CAPS text on buttons
          borderRadius: '6px',
          fontWeight: 600,
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
      color: '#111827',
    },
    h4: {
      fontWeight: 600,
      color: '#111827',
    },
    h6: {
      fontWeight: 600,
    }
  },
});

export default theme;