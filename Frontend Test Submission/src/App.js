import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import HomePage from './pages/HomePage';
import StatisticsPage from './pages/StatisticsPage';
import logger from './utils/logger';

// Create theme instance with better contrast and accessibility
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      dark: '#115293',
      light: '#4791db'
    },
    secondary: {
      main: '#dc004e',
      dark: '#9a0036',
      light: '#e33371'
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(',')
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    }
  }
});

function App() {
  logger.info('Application started', {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
