import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

export default function ChatArea({
  animationTriggered,
  safeMessages,
  input,
  setInput,
  handleSend,
  handleFileUpload,
  sending
}) {
  return (
    <Box sx={{ 
      width: '80%', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative',
      height: '100%',
      overflow: 'hidden',  
      ml: '0px'  
    }}>
      {/* Scrollable Messages Area */}
      <Fade in={animationTriggered} timeout={1600}>
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',  
          ml: '100px',  
          paddingBottom: '120px',  
          height: 'calc(100% - 120px)',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          '-ms-overflow-style': 'none',  // IE and Edge
          'scrollbar-width': 'none',     // Firefox
        }}>
          <MessageList safeMessages={safeMessages} />
        </Box>
      </Fade>

      {/* Sticky Chat Input */}
      <Slide direction="up" in={animationTriggered} timeout={2000}>
        <div style={{
          position: 'absolute',
          bottom: '30px',  // Moved up to make room for text below
          left: 0,
          right: 0,
          zIndex: 1000,  
          backgroundColor: 'rgba(247, 247, 248, 0.95)', 
          paddingTop: '10px',
        }}>
          <ChatInput
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            handleFileUpload={handleFileUpload}
            sending={sending}
          />
        </div>
      </Slide>

      {/* Text under chat bar */}
      <Fade in={animationTriggered} timeout={2200}>
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: '0px',  // Positioned at the very bottom
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'text.secondary',
            fontSize: '0.75rem',
            zIndex: 1000,  // High z-index to ensure it's above content
            backgroundColor: 'rgba(247, 247, 248, 0.95)',  // Semi-transparent background
            paddingTop: '5px',
            paddingBottom: '5px',
            ml: '125px' 
          }}
        >
          NestWise can make mistakes. Check important info.
        </Typography>
      </Fade>
    </Box>
  );
}