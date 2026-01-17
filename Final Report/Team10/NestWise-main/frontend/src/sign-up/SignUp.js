import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import { GoogleIcon, FacebookIcon, SitemarkIcon } from './components/CustomIcons';
import Sitemark from './components/SitemarkIcon';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import Zoom from '@mui/material/Zoom';
import { useNavigate } from 'react-router-dom';
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
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '1000px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
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

export default function SignUp(props) {
  const navigate = useNavigate();



  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');



  // Animation state
  const [checked, setChecked] = React.useState(false);

  // Loading and success states
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);



  // Trigger animations when component mounts
  React.useEffect(() => {
    setChecked(true);
  }, []);





  const validateInputs = () => {
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const name = document.getElementById('name');

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

    if (!name.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage('Name is required.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    return isValid;
  };





  const handleSubmit = async (event) => {
    event.preventDefault(); // always prevent default at start

    if (!validateInputs()) {
      return; // Stop if validation fails
    }

    const formData = new FormData(event.currentTarget);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    };

    try {
      const response = await fetch('http://localhost:7001/userauth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to sign up');
      }

      const result = await response.json();
      console.log('Sign up successful:', result);





      // ----------HANDLING OF SUCCESSFUL SIGN-UP----------

      setIsLoading(false);
      setIsSuccess(true);

      setTimeout(() => {
        navigate('/signin');
      }, 1500);


    } catch (error) {
      console.error('Error during sign up:', error.message);
      alert(`Sign up failed: ${error.message}`); // Show error to user
    }
  };




  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">

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
            <Typography variant="h6">Account Created Successfully!</Typography>
            <Typography variant="body1">Redirecting To Sign-In...</Typography>
          </Box>
        </Backdrop>

        <Fade in={checked} timeout={800}>
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
              Sign Up
            </Typography>

            {/* Main content layout with form on left, social on right */}
            <Box sx={{ display: 'flex', gap: 4, width: '100%', alignItems: 'flex-start' }}>
              {/* Left side - Main sign up form */}
              <Box sx={{ flex: 1, minWidth: '300px' }}>
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <FormControl>
                    <FormLabel htmlFor="name">Full name</FormLabel>
                    <TextField
                      autoComplete="name"
                      name="name"
                      required
                      fullWidth
                      id="name"
                      placeholder="Jon Snow"
                      error={nameError}
                      helperText={nameErrorMessage}
                      color={nameError ? 'error' : 'primary'}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <TextField
                      required
                      fullWidth
                      id="email"
                      placeholder="your@email.com"
                      name="email"
                      autoComplete="email"
                      variant="outlined"
                      error={emailError}
                      helperText={emailErrorMessage}
                      color={emailError ? 'error' : 'primary'}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="password">Password</FormLabel>
                    <TextField
                      required
                      fullWidth
                      name="password"
                      placeholder="••••••"
                      type="password"
                      id="password"
                      autoComplete="new-password"
                      variant="outlined"
                      error={passwordError}
                      helperText={passwordErrorMessage}
                      color={passwordError ? 'error' : 'primary'}
                    />
                  </FormControl>
                  <FormControlLabel
                    control={<Checkbox value="allowExtraEmails" color="primary" />}
                    label="I want to receive updates via email."
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                  >
                    Sign up
                  </Button>
                </Box>
              </Box>

              {/* Right side - social signup and signin */}
              <Box sx={{
                flex: 1,
                minWidth: '250px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                <Divider sx={{ mb: 1 }}>
                  <Typography sx={{ color: 'text.secondary' }}>or</Typography>
                </Divider>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => alert('Sign up with Google')}
                  startIcon={<GoogleIcon />}
                >
                  Sign up with Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => alert('Sign up with Facebook')}
                  startIcon={<FacebookIcon />}
                >
                  Sign up with Facebook
                </Button>
                <Typography sx={{ textAlign: 'center', mt: 1 }}>
                  Already have an account?{' '}
                  <Link
                    href="/material-ui/getting-started/templates/sign-in/"
                    variant="body2"
                    sx={{ alignSelf: 'center' }}
                  >
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Card>
        </Fade>
      </SignUpContainer>
    </AppTheme>
  );
}