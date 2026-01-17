import * as React from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grow from '@mui/material/Grow';
import DisplayedPlans from './DisplayedPlans';

export default function Sidebar({ animationTriggered, profileData }) {
  return (
    <Box
      sx={{
        width: '85%',
        bgcolor: 'grey.200',
        p: 1,
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Grow in={animationTriggered} timeout={1400}>
        <Box sx={{ width: '100%' }}>
          <DisplayedPlans animationTriggered={animationTriggered} />
        </Box>
      </Grow>

      
    </Box>
  );
}