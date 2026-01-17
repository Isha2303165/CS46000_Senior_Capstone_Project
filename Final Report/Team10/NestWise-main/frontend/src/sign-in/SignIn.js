import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import ForgotPassword from './components/ForgotPassword';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import { GoogleIcon, FacebookIcon } from './components/CustomIcons';
import { useNavigate } from 'react-router-dom';
import Sitemark from './components/SitemarkIcon';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';


const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '1000px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn(props) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Animation state
  const [checked, setChecked] = React.useState(false);

  // Trigger animations when component mounts
  React.useEffect(() => {
    setChecked(true);
  }, []);



  // Loading and success states
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);





  const validateInputs = () => {
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    const formData = new FormData(event.currentTarget);
    const userData = {
      name: ('NestWise User'), // Placeholder name
      email: formData.get('email'),
      password: formData.get('password'),
    };

    try {
      const response = await fetch('http://localhost:7001/userauth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to sign in');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      console.log('Sign-in successful:', data);



      // ----------HANDLING OF SUCCESSFUL SIGN-UP----------

      setIsLoading(false);
      setIsSuccess(true);

      setTimeout(() => {
        navigate('/');
      }, 1500);



    } catch (error) {
      console.error('Error signing in:', error.message);
      setEmailError(true);
      setEmailErrorMessage('Invalid email or password.');
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">


        {/* Success Overlay */}
        <Backdrop
          sx={{
            color: '#c47c1eff',
            zIndex: (theme) => theme.zIndex.modal + 1,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          open={isSuccess}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" size={60} />
            <Typography variant="h6">Logging you in.</Typography>
            <Typography variant="body1">Redirecting to home page...</Typography>
          </Box>
        </Backdrop>





        <Fade in={checked} timeout={800}>
          <Slide direction="up" in={checked}>
            <Card variant="outlined" sx={{
              alignItems: 'flex-start',
              maxWidth: '1000px',
              minHeight: 'auto',
              height: 'auto',
              overflow: 'visible'
            }}>

              <Sitemark />

              <Divider sx={{
                backgroundColor: '#828282ff',
                height: '1px',
                border: 'none',
                opacity: 0.5,
                my: 0.1,
                width: '100%',
                borderRadius: '5px'
              }} />

              <Typography
                component="h1"
                variant="h4"
                sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
              >
                Sign In
              </Typography>

              {/* Main content layout with form on left, social on right */}
              <Box sx={{ display: 'flex', gap: 4, width: '100%', alignItems: 'flex-start' }}>
                {/* Left side - Main sign in form */}
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
                  >
                    <FormControl>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <TextField
                        error={emailError}
                        helperText={emailErrorMessage}
                        id="email"
                        type="email"
                        name="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        autoFocus
                        required
                        fullWidth
                        variant="outlined"
                        color={emailError ? 'error' : 'primary'}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <TextField
                        error={passwordError}
                        helperText={passwordErrorMessage}
                        name="password"
                        placeholder="••••••"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        required
                        fullWidth
                        variant="outlined"
                        color={passwordError ? 'error' : 'primary'}
                      />
                    </FormControl>
                    <FormControlLabel
                      control={<Checkbox value="remember" color="primary" />}
                      label="Remember me"
                    />
                    <ForgotPassword open={open} handleClose={handleClose} />
                    <Button type="submit" fullWidth variant="contained">
                      Sign in
                    </Button>
                    <Link
                      component="button"
                      type="button"
                      onClick={handleClickOpen}
                      variant="body2"
                      sx={{ alignSelf: 'center' }}
                    >
                      Forgot your password?
                    </Link>
                  </Box>
                </Box>

                {/* Right side - social login and signup */}
                <Box sx={{
                  flex: 1,
                  minWidth: '250px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Divider sx={{ mb: 1 }}>or</Divider>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => alert('Sign in with Google')}
                    startIcon={<GoogleIcon />}
                  >
                    Sign in with Google
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => alert('Sign in with Facebook')}
                    startIcon={<FacebookIcon />}
                  >
                    Sign in with Facebook
                  </Button>
                  <Typography sx={{ textAlign: 'center', mt: 1 }}>
                    Don&apos;t have an account?{' '}
                    <Link component="button" onClick={() => navigate('/signup')} variant="body2">
                      Sign up
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Slide>
        </Fade>
      </SignInContainer>
    </AppTheme>
  );
}