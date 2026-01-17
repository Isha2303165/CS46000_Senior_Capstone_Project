import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ColorModeIconDropdown from '../shared-theme/ColorModeIconDropdown';
import Sitemark from './SitemarkIcon';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useEffect } from 'react';




const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  borderRadius: 0,
  backdropFilter: 'blur(24px)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: 'none',  // REMOVED THE SHADOW
  padding: '8px 12px',
}));






function checkTokenValidity(token) {
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  }
  catch {
    return false;
  }
}



function getUserFromToken(token) {
  if (!token) {
    return null;
  }
  try {

    const payload = JSON.parse(atob(token.split('.')[1]));
    return { email: payload.sub, name: payload.name || payload.sub };
  }
  catch {
    return null;
  }
}









export default function AppBarComponent() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const [, setRerender] = React.useState(0);



  React.useEffect(() => {
    const interval = setInterval(() => {
      setRerender(val => val + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  


  //  Get user based off of their token validity.
  const token = localStorage.getItem('token');
  console.log('token:', token);
  const isAuthenticated = checkTokenValidity(token);
  console.log('isAuthenticated:', isAuthenticated);
  const user = isAuthenticated ? getUserFromToken(token) : null;
  console.log('user:', user);



  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };



  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };





  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
      }}
    >
      <StyledToolbar variant="dense" disableGutters>
        {/* Left side: Sitemark + buttons */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
          <Box
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Sitemark />
          </Box>

          {/* Desktop navigation buttons evenly spaced */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, width: '100%' }}>
            <Button sx={{ flex: 1 }} variant="text" color="info" size="small" onClick={() => navigate('/plannerbot')}>
              Planner Bot
            </Button>
            <Button sx={{ flex: 1 }} variant="text" color="info" size="small" onClick={() => navigate('/myplans')}>
              My Plans
            </Button>
            <Button sx={{ flex: 1 }} variant="text" color="info" size="small" onClick={() => navigate('/testimonials')}>
              Testimonials
            </Button>
            <Button sx={{ flex: 1 }} variant="text" color="info" size="small" onClick={() => navigate('/faq')}>
              FAQ
            </Button>
          </Box>
        </Box>



        {/* Desktop buttons */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <AccountCircleIcon
                onClick={() => navigate('/profile')}
                sx={{
                  color: '#c47c1eff',
                  mr: 1,
                  transition: 'background 0.2s, border-radius 0.2s',
                  '&:hover': {
                    backgroundColor: 'hsl(30, 50%, 40%) !important',
                    borderRadius: '50%',
                    boxShadow: 'none !important',
                  },
                }}
              />

              <Box sx={{ fontWeight: 600, color: '#333', mr: 2 }}>
                {user?.name}
              </Box>

              <Button
                variant="contained"
                size="small"
                onClick={handleLogout}
                sx={{
                  backgroundColor: 'hsl(30, 40%, 50%) !important',
                  color: 'white !important',
                  boxShadow: 'none !important',
                  border: '1px solid hsl(30, 40%, 50%) !important',
                  '&:hover': {
                    backgroundColor: 'hsl(30, 50%, 40%) !important',
                    boxShadow: 'none !important',
                  },
                  '&:active': {
                    backgroundColor: 'hsl(30, 50%, 30%) !important',
                  },
                  '&:focus': {
                    backgroundColor: 'hsl(30, 40%, 50%) !important',
                    boxShadow: 'none !important',
                  },
                  '&.Mui-focusVisible': {
                    backgroundColor: 'hsl(30, 40%, 50%) !important',
                    boxShadow: '0 0 0 3px rgba(139, 69, 19, 0.3) !important',
                  }
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                color="info"
                variant="text"
                size="small"
                onClick={() => navigate('/signin')}
                sx={{
                  color: 'primary',
                  '&:hover': {
                    backgroundColor: 'rgba(187, 15, 15, 0.04)',
                  }
                }}
              >
                Sign in
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/signup')}
                sx={{
                  backgroundColor: 'hsl(30, 40%, 50%) !important',
                  color: 'white !important',
                  boxShadow: 'none !important',
                  border: '1px solid hsl(30, 40%, 50%) !important',
                  '&:hover': {
                    backgroundColor: 'hsl(30, 50%, 40%) !important',
                    boxShadow: 'none !important',
                  },
                  '&:active': {
                    backgroundColor: 'hsl(30, 50%, 30%) !important',
                  },
                  '&:focus': {
                    backgroundColor: 'hsl(30, 40%, 50%) !important',
                    boxShadow: 'none !important',
                  },
                  '&.Mui-focusVisible': {
                    backgroundColor: 'hsl(30, 40%, 50%) !important',
                    boxShadow: '0 0 0 3px rgba(139, 69, 19, 0.3) !important',
                  }
                }}
              >
                Sign up
              </Button>
              <ColorModeIconDropdown />
            </>
          )}
        </Box>


        {/* Mobile drawer */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
          <ColorModeIconDropdown size="medium" />
          <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>

          <Drawer
            anchor="top"
            open={open}
            onClose={toggleDrawer(false)}
            PaperProps={{ sx: { top: 0 } }} // drawer starts at top
          >
            <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={toggleDrawer(false)}>
                  <CloseRoundedIcon />
                </IconButton>
              </Box>

              {/* Mobile menu items */}
              <MenuItem onClick={() => { navigate('/plannerbot'); setOpen(false); }}>Planner Bot</MenuItem>
              <MenuItem onClick={() => { navigate('/myplans'); setOpen(false); }}>My Plans</MenuItem>
              <MenuItem onClick={() => { navigate('/testimonials'); setOpen(false); }}>Testimonials</MenuItem>
              <MenuItem onClick={() => { navigate('/highlights'); setOpen(false); }}>Highlights</MenuItem>
              <MenuItem onClick={() => { navigate('/pricing'); setOpen(false); }}>Pricing</MenuItem>
              <MenuItem onClick={() => { navigate('/faq'); setOpen(false); }}>FAQ</MenuItem>
              <MenuItem onClick={() => { navigate('/blog'); setOpen(false); }}>Blog</MenuItem>

              <Divider sx={{ my: 3 }} />

              <MenuItem>
                <Button
                  color="primary"
                  variant="contained"
                  fullWidth
                  onClick={() => { navigate('/signup'); setOpen(false); }}
                >
                  Sign up
                </Button>
              </MenuItem>
              <MenuItem>
                <Button
                  color="primary"
                  variant="outlined"
                  fullWidth
                  onClick={() => { navigate('/signin'); setOpen(false); }}
                >
                  Sign in
                </Button>
              </MenuItem>
            </Box>
          </Drawer>
        </Box>
      </StyledToolbar>
    </AppBar>
  );
}
