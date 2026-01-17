import * as React from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grow from '@mui/material/Grow';
import PlanSelector from './PlanSelector';
import ProfileData from './ProfileData';

export default function Sidebar({ animationTriggered, profileData, lastChatbotResponse }) {
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
          <PlanSelector animationTriggered={animationTriggered} />
        </Box>
      </Grow>

      <Divider sx={{ borderBottomWidth: 2, mb: 1, mt: 1.5 }} />

      <Grow in={animationTriggered} timeout={1800}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ProfileData 
          animationTriggered={animationTriggered} 
          profileData={profileData} 
          lastChatbotResponse={lastChatbotResponse}  
          />
        </Box>
      </Grow>
    </Box>
  );
}