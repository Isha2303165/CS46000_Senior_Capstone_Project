// PlannerBot.js
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import visuallyHidden from '@mui/utils/visuallyHidden';

export default function PlannerBot() {
  return (
    <Box
      id="planner-bot-hero"
      sx={(theme) => ({
        width: '100%',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
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
          textAlign: 'center',
          pt: { xs: 10, sm: 16 },
          pb: { xs: 8, sm: 12 },
        }}
      >
        <Stack spacing={2} useFlexGap sx={{ width: { xs: '100%', sm: '70%' } }}>
          {/* Heading */}
          <Typography
            variant="h1"
            sx={{
              fontSize: 'clamp(3rem, 10vw, 3.5rem)',
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Plan&nbsp;Your&nbsp;Future&nbsp;with&nbsp;
            <Typography
              component="span"
              variant="h1"
              sx={(theme) => ({
                fontSize: 'inherit',
                color: 'primary.main',
                ...theme.applyStyles('dark', {
                  color: 'primary.light',
                }),
              })}
            >
              PlannerBot
            </Typography>
          </Typography>

          {/* Subheading */}
          <Typography
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              width: { sm: '100%', md: '80%' },
            }}
          >
            Plan your retirement with confidence, building a secure future tailored
            to your goals. Take control today with personalized strategies and
            expert guidance.
          </Typography>

          {/* Email input + button */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            useFlexGap
            sx={{ pt: 2, width: { xs: '100%', sm: '350px' } }}
          >
            <InputLabel htmlFor="plannerbot-email" sx={visuallyHidden}>
              Email
            </InputLabel>
            <TextField
              id="plannerbot-email"
              hiddenLabel
              size="small"
              variant="outlined"
              placeholder="Enter your email"
              fullWidth
              slotProps={{
                htmlInput: {
                  autoComplete: 'off',
                  'aria-label': 'Enter your email address',
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ minWidth: 'fit-content' }}
            >
              Get Started
            </Button>
          </Stack>

          {/* Terms */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            By clicking &quot;Get Started&quot; you agree to our&nbsp;
            <Link href="#" color="primary">
              Terms & Conditions
            </Link>
            .
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
