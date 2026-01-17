import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import AppTheme from '../shared-theme/AppTheme';
import AppBar from '../app-bar/AppBar';
import Hero from './components/Hero';
import LogoCollection from './components/LogoCollection';
import Features from './components/Features';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

export default function MarketingPage(props) {
  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Box 
        sx={{ 
          overflowX: 'hidden',
          width: '100%',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        <AppBar />
        <Hero />
        <Divider />
        <Box sx={{ width: '100%' }}>
          <Features />
          <Divider />
          <FAQ />
          <Divider />
          <Footer />
          <LogoCollection/>
        </Box>
      </Box>
    </AppTheme>
  );
}