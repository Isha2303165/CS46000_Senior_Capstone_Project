import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grow from '@mui/material/Grow';
import Divider from '@mui/material/Divider';
import ReactMarkdown from 'react-markdown';

// ThinkingAnimation component
const ThinkingAnimation = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
      padding: 1,
      color: '#666',
      backgroundColor: 'transparent',
    }}
  >
    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
      NestWise Bot Is Thinking
    </Typography>
    <Box sx={{ display: 'flex', gap: 0.25 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: '#666',
            animation: 'thinking 1.4s infinite',
            animationDelay: `${i * 0.2}s`,
            '@keyframes thinking': {
              '0%, 60%, 100%': {
                transform: 'translateY(0)',
                opacity: 0.5,
              },
              '30%': {
                transform: 'translateY(-10px)',
                opacity: 1,
              },
            },
          }}
        />
      ))}
    </Box>
  </Box>
);





export default function MessageList({ safeMessages }) {
  const messagesEndRef = React.useRef(null);
  const containerRef = React.useRef(null);





  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };






  // Scroll to the latest user message when it's sent
  const scrollToLatestUserMessage = () => {
    if (safeMessages.length > 0) {
      const lastMessage = safeMessages[safeMessages.length - 1];
      if (lastMessage.role === 'user') {
        // Small delay to ensure the message is rendered
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }
  };




  // Effect to handle scrolling when messages change
  React.useEffect(() => {
    if (safeMessages.length > 0) {
      const lastMessage = safeMessages[safeMessages.length - 1];
      
      // If it's a user message, scroll immediately
      if (lastMessage.role === 'user') {
        scrollToLatestUserMessage();
      }
      // If it's a bot message or thinking, scroll to follow the response
      else if (lastMessage.role === 'bot' || lastMessage.isThinking) {
        scrollToBottom();
      }
    }
  }, [safeMessages]);




  // Helper function to determine if we should show a divider
  const shouldShowDivider = (currentMsg, index) => {
    if (index === 0) return false; // No divider before first message
    
    const previousMsg = safeMessages[index - 1];
    
    // Show divider when transitioning from user message to bot message (or thinking)
    return previousMsg.role === 'user' && 
           (currentMsg.role === 'bot' || currentMsg.isThinking);
  };





  return (
    <Box
      ref={containerRef}
      sx={{
        px: 2,
        py: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
        scrollBehavior: 'smooth',
        // Hide scrollbar but keep functionality
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        '-ms-overflow-style': 'none',  // IE and Edge
        'scrollbar-width': 'none',     // Firefox
      }}
    >
      {safeMessages.map((msg, index) => (
        <React.Fragment key={index}>
          {/* Add divider with padding when transitioning from user to bot */}
          {shouldShowDivider(msg, index) && (
            <Box sx={{ py: 4 }}>
              <Divider 
                sx={{ 
                  opacity: 0.6,
                  borderColor: 'rgba(149, 149, 149, 0.2)',
                  borderWidth: '1px'
                }} 
              />
            </Box>
          )}
          
          <Grow in={true} timeout={500}>
            <Box
              sx={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 1,
                ...(msg.role === 'user' ? {
                  bgcolor: 'primary.main',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                } : {
                  bgcolor: 'transparent',
                  color: 'text.primary',
                  px: 0,
                  py: 0,
                }),
                maxWidth: '75%',
              }}
            >
              {msg.isThinking ? (
                <ThinkingAnimation />
              ) : msg.role === 'user' ? (
                <Typography variant="body1">{msg.content}</Typography>
              ) : (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: 'text.primary' }}>
                        {children}
                      </Typography>
                    ),
                    h2: ({ children }) => (
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1.5, mb: 0.5, color: 'text.primary' }}>
                        {children}
                      </Typography>
                    ),
                    h3: ({ children }) => (
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1, mb: 0.5, color: 'text.primary' }}>
                        {children}
                      </Typography>
                    ),
                    p: ({ children }) => (
                      <Typography variant="body1" sx={{ mb: 1, color: 'text.primary', lineHeight: 1.6 }}>
                        {children}
                      </Typography>
                    ),
                    li: ({ children }) => (
                      <Typography component="li" variant="body1" sx={{ ml: 2, mb: 0.5, color: 'text.primary' }}>
                        {children}
                      </Typography>
                    ),
                    ul: ({ children }) => (
                      <Box component="ul" sx={{ pl: 2, mb: 1 }}>
                        {children}
                      </Box>
                    ),
                    ol: ({ children }) => (
                      <Box component="ol" sx={{ pl: 2, mb: 1 }}>
                        {children}
                      </Box>
                    ),
                    strong: ({ children }) => (
                      <Box component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        {children}
                      </Box>
                    ),
                    em: ({ children }) => (
                      <Box component="span" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                        {children}
                      </Box>
                    ),
                    code: ({ children }) => (
                      <Box 
                        component="code"
                        sx={{ 
                          backgroundColor: '#f5f5f5', 
                          padding: '2px 4px', 
                          borderRadius: '3px',
                          fontFamily: 'monospace',
                          fontSize: '0.875em',
                          color: 'text.primary'
                        }}
                      >
                        {children}
                      </Box>
                    ),
                    pre: ({ children }) => (
                      <Box
                        component="pre"
                        sx={{
                          backgroundColor: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '6px',
                          overflow: 'auto',
                          marginBottom: '8px',
                          fontFamily: 'monospace',
                          color: 'text.primary'
                        }}
                      >
                        {children}
                      </Box>
                    ),
                    blockquote: ({ children }) => (
                      <Box
                        component="blockquote"
                        sx={{
                          borderLeft: '4px solid #ddd',
                          pl: 2,
                          ml: 0,
                          mb: 1,
                          fontStyle: 'italic',
                          color: 'text.secondary'
                        }}
                      >
                        {children}
                      </Box>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </Box>
          </Grow>
        </React.Fragment>
      ))}
      
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} style={{ height: '20px' }} />
    </Box>
  );
}