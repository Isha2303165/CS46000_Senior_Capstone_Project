import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';

export default function ChatInput({
  input,
  setInput,
  handleSend,
  handleFileUpload,
  sending
}) {
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        justifyContent: 'flex-start',
        py: 1.5,
        background: 'transparent',
      }}
    >
      <Box sx={{ 
        width: '70%', 
        maxWidth: '800px', 
        display: 'flex', 
        gap: 1,
        ml: '190px'  // Change this pixel value to position it exactly where you want
      }}>
        <Button
          variant="outlined"
          component="label"
          sx={{
            minWidth: '80px',
            height: '50px',
            borderRadius: 3,
            fontWeight: 'bold',
          }}
        >
          Upload
          <input type="file" hidden multiple onChange={handleFileUpload} />
        </Button>
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            boxShadow: '0px 4px 16px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 0.1,
            flexGrow: 1,
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            variant="standard"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();  // Prevent new line
                handleSend();
              }
            }}
            InputProps={{ disableUnderline: true }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}