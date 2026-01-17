import * as React from 'react';
import Box from '@mui/material/Box';
import Zoom from '@mui/material/Zoom';
import Slide from '@mui/material/Slide';
import Sidebar from './SideBar';
import ContentViewer from './ContentViewer';

export default function ChatContainer({
  animationTriggered,
  profileData,
  safeMessages,
  input,
  setInput,
  handleSend,
  handleFileUpload,
  sending
}) {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Zoom in={animationTriggered} timeout={1000}>
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            width: '100%',
            border: 1,
            borderColor: 'divider',
            borderRadius: 0,
            overflow: 'hidden',
            position: 'relative',
            bgcolor: '#f7f7f8',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}
        >
          <Slide direction="right" in={animationTriggered} timeout={1200}>
            <Box sx={{ width: '20%', display: 'flex' }}>
              <Sidebar
                animationTriggered={animationTriggered}
                profileData={profileData}
              />
            </Box>
          </Slide>

          <Slide direction="left" in={animationTriggered} timeout={1200}>
            <Box sx={{ 
              flex: 1, 
              display: 'flex',
              padding: '16px',                    
              marginLeft: '-40px',                
              marginTop: '10px',                
              width: '100%',         
              height: '100%',        
            }}>
              <ContentViewer
                animationTriggered={true}





                // THIS WILL NEED CHANGED IN THE FUTURE.
                pdfUrl="path/to/your/document.pdf"
                leftData={{
                  "Total Plans": "3",
                  "Active Users": "1,247",
                  "Monthly Growth": "12.5%",
                  "Revenue": "$45,000"
                }}
                rightData={{
                  "Success Rate": "94%",
                  "Avg Response": "2.3s",
                  "Satisfaction": "4.8/5",
                  "Uptime": "99.9%"
                }}






                topBoxHeight={450}
                bottomBoxHeight={250}
                containerPadding={16}
                leftOffset={0}
              />
            </Box>
          </Slide>
        </Box>
      </Zoom>
    </Box>
  );
}