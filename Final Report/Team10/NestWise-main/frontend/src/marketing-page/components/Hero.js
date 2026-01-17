import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import Zoom from '@mui/material/Zoom';
import visuallyHidden from '@mui/utils/visuallyHidden';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';



export default function Hero() {
  const [checked, setChecked] = React.useState(false);
  const [isTokenValid, setIsTokenValid] = React.useState(true);
  const navigate = useNavigate();


  // Trigger animations when component mounts
  React.useEffect(() => {
    setChecked(true);
  }, []);






  // --------------TOKEN CHECKING--------------
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



  // --------------GET USER INFO WITH TOKEN--------------
  function getUserFromToken(token) {
    if (!token) {
      return;
    }
    try {

      const payload = JSON.parse(atob(token.split('.')[1]));
      return { email: payload.sub, name: payload.name || payload.sub };
    }
    catch {
      return null;
    }
  }





  // --------------USEEFFECT FOR PAGE RE-RENDERS IF TOKEN IS BAD--------------
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');

      setIsTokenValid(checkTokenValidity(token));
    };
    // Check if token is vaild once.
    checkAuth();
    const interval = setInterval(checkAuth, 2000); // Repeat check.
    return () => clearInterval(interval);
  }, []);




  // --------------STATE FOR USER DATA--------------
  const token = localStorage.getItem('token');
  const [profile, setProfile] = useState(getUserFromToken(token));



  return (
    <Box
      id="hero"
      sx={(theme) => ({
        width: '100%',
        backgroundRepeat: 'no-repeat',
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 90%), transparent)',
        ...theme.applyStyles('dark', {
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 16%), transparent)',
        }),
      })}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: { xs: 14, sm: 20 },
          pb: { xs: 8, sm: 12 },
        }}
      >
        <Stack
          spacing={2}
          useFlexGap
          sx={{ alignItems: 'center', width: { xs: '100%', sm: '70%' } }}
        >


          {isTokenValid ? (

            <React.Fragment>
              {/* Large heading with slide animation */}
              <Slide direction="down" in={checked} timeout={1000}>


                <Typography
                  variant="h1"
                  sx={{
                    fontSize: 'clamp(3rem, 10vw, 3.5rem)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  Welcome back, {' '}
                  <Typography
                    variant="h0.5"
                    component="span"
                    sx={{
                      color: '#c47c1eff', // Light Brown for "Wise"
                    }}
                  >
                    {profile?.name || 'User'}!
                  </Typography>
                </Typography>
              </Slide>


              <Zoom in={checked} timeout={1500}>
                <Typography
                  sx={{
                    textAlign: 'center',
                    color: 'text.secondary',
                    width: { sm: '100%', md: '80%' },
                  }}
                >
                  <strong>Let's continue building your personalized retirement plans!</strong>
                </Typography>
              </Zoom>



              {/* Email input + button with zoom animation */}
              <Zoom in={checked} timeout={2000}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  useFlexGap
                  sx={{ pt: 1, width: { xs: '100%', sm: '350px' }, alignItems: 'center', justifyContent: 'center' }}
                >


                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{ minWidth: '20%' }}
                    onClick={() => navigate('/myplans')}
                  >
                    go to my plans
                  </Button>
                </Stack>
              </Zoom>


            </React.Fragment>

          ) : (

            <React.Fragment>
              {/* Large heading with slide animation */}
              <Slide direction="down" in={checked} timeout={1000}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: 'clamp(3rem, 10vw, 3.5rem)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  Welcome to {' '}
                  <Typography
                    variant="h0.5"
                    component="span"
                    sx={{
                      color: '#FFD700', // Gold for "Nest"
                    }}
                  >
                    Nest
                  </Typography>
                  <Typography
                    variant="h0.5"
                    component="span"
                    sx={{
                      color: '#c47c1eff', // Light Brown for "Wise"
                    }}
                  >
                    Wise
                  </Typography>
                </Typography>
              </Slide>

              <Zoom in={checked} timeout={1500}>
                <Typography
                  sx={{
                    textAlign: 'center',
                    color: 'text.secondary',
                    width: { sm: '100%', md: '80%' },
                  }}
                >
                  <strong>Plan your retirement with confidence, building a secure future tailored to your goals. Get a personalized plan sent straight to your email!</strong>
                </Typography>
              </Zoom>



              {/* Email input + button with zoom animation */}
              <Zoom in={checked} timeout={2000}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  useFlexGap
                  sx={{ pt: 1, width: { xs: '100%', sm: '350px' }, alignItems: 'center', justifyContent: 'center' }}
                >


                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{ minWidth: '20%' }}
                    onClick={() => navigate('/signin')}
                  >
                    sign up today!
                  </Button>
                </Stack>
              </Zoom>
            </React.Fragment>

          )}




          {/* Terms and conditions with slide from bottom */}
          <Slide direction="up" in={checked} timeout={2500}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'center' }}
            >
              Please read our&nbsp;
              <Link href="#" color="primary">
                Terms & Conditions
              </Link>
              .
            </Typography>
          </Slide>
        </Stack>
      </Container>
    </Box>
  );
}