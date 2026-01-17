import * as React from 'react';
import { useEffect, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Slide from '@mui/material/Slide';
import Box from '@mui/material/Box';
import AppTheme from '../shared-theme/AppTheme';
import AppBar from '../app-bar/AppBar';
import ContentContainer from './components/ContentContainer';
import { useRef } from 'react';

export default function PlannerBot() {

  const [animationTriggered, setAnimationTriggered] = useState(false);




  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationTriggered(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);






















  return (
  <AppTheme>
    <CssBaseline />
    <AppBar />

    <Box 
      sx={{ 
        position: 'fixed',
        top: 48, // Dense AppBar is typically 48px instead of 64px
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: 'calc(100vh - 48px)', // Adjusted for dense AppBar
        overflow: 'hidden'
      }}
    >
      <Slide direction="up" in={animationTriggered} timeout={800}>
        <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
          <ContentContainer
            animationTriggered={animationTriggered}
          />
        </Box>
      </Slide>
    </Box>

  </AppTheme>
);


}