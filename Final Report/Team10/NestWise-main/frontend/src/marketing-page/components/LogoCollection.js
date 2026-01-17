import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useColorScheme } from '@mui/material/styles';

// Array of logo paths (relative to public folder)
const logoLinks = ['/images/pfw.png'];

const logoStyle = {
  width: '300px',    // Increased from 100px
  height: '165px',   // Increased from 80px
  margin: '0 32px',
};

export default function LogoCollection() {
  const { mode, systemMode } = useColorScheme();

  return (
    <Box id="logoCollection" sx={{ py: 2 }}>
      <Typography
        component="p"
        variant="subtitle2"
        align="center"
        sx={{ color: 'text.secondary' }}
      >
        Trusted by:
      </Typography>
      <Grid container sx={{
        justifyContent: 'center',
        mt: 2,           // Increased margin top
        mb: 2,           // Added margin bottom
        px: 4,           // Added horizontal padding
        opacity: 0.8
      }}>
        {logoLinks.map((logo, index) => (
          <Grid key={index}>
            <img
              src={logo}
              alt={`Company logo ${index + 1}`}
              style={logoStyle}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}