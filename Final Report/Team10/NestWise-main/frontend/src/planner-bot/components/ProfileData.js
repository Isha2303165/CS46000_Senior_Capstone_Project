import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import { useState, useEffect } from 'react';

export default function ProfileData({ animationTriggered, profileData, lastChatbotResponse }) {
  const [formattedData, setFormattedData] = useState({});
  const [isFormatting, setIsFormatting] = useState(false);

  // FORMAT TEXT
  const textizer = async () => {
    if (Object.keys(profileData).length === 0) {
      return;
    }

    if (isFormatting) {
      return;
    }

    setIsFormatting(true);


    try {
      const response = await fetch('http://localhost:8000/textizer/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileData: profileData,
          lastChatbotResponse: lastChatbotResponse
        })
      });


      if (!response.ok) {
        throw new Error('Textizer API call failed.');
      }


      const textizerReturn = await response.json();
      setFormattedData(textizerReturn);
    }
    catch (error) {
      // FALL BACK FORMATTING IF THIS BREAKS
      console.error('Textizer API error:', error);
      const fallback = {};
      Object.entries(profileData).forEach(([key, value]) => {
        fallback[key] = value === false || value === null ? "" : String(value);
      });
      setFormattedData(fallback);
    }
    finally {
      setIsFormatting(false);
    }
  };



  // FORMAT ON RE-RENDER
  useEffect(() => {
    textizer();
  }, [profileData, lastChatbotResponse]);



  return (
    <Box
      sx={{
        bgcolor: 'grey.50',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: 1,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        ml: '0px', // Pixel positioning control
        mt: '0px', // Pixel positioning control
      }}
    >
      <Typography variant="h6" sx={{
        mb: 0.01,
        textAlign: 'left',
        width: '100%',
        ml: '9px', // Pixel positioning control
        mt: '0px', // Pixel positioning control
      }}>
        Data For Your Plan:
      </Typography>
      <Divider sx={{
        borderBottomWidth: 2,
        mb: 1,
        mt: 1,
        ml: '0px', // Pixel positioning control
      }} />
      <Box
        className="profile-data-scroll"
        sx={{
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2,
          ml: '0px', // Pixel positioning control
          mt: '0px', // Pixel positioning control
          maxHeight: '100%',

        }}>


        {Object.keys(formattedData).length !== 0 ? (
          Object.entries(formattedData).map(([key, value], index) => (
            <Fade in={animationTriggered} timeout={2000 + (index * 200)} key={key}>
              <Box sx={{
                mb: 2,
                width: '80%',
                maxWidth: '200px',
                ml: '16px',
                mt: '0px',
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    display: 'flex',
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    mb: 0.5,
                    ml: '0px',
                    '&::before': {
                      content: '"•"',
                      marginRight: '6px',
                    }
                  }}
                >
                  {key}:
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    fontWeight: 'bold',
                    ml: '12px', 
                    mt: '4px',
                  }}
                >
                  {value}
                </Typography>

                <Divider sx={{ mt: 0.5 }} /> {/* Reduced divider spacing */}
              </Box>
            </Fade>
          ))


        ) : (


          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
            No data available yet.
          </Typography>


        )}

      </Box>

      <Typography variant="caption" sx={{
        color: 'text.secondary',
        fontSize: '0.7rem',
        textAlign: 'center',
        ml: '0px', // Pixel positioning control
        mt: 'auto', // Pixel positioning control
      }}>
        Tell chatbot if data is not accurate.
      </Typography>

    </Box >
  );
}