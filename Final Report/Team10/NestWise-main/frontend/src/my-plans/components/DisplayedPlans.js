import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grow from '@mui/material/Grow';
import Fade from '@mui/material/Fade';
import FolderIcon from '@mui/icons-material/Folder';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import FeedbackIcon from '@mui/icons-material/Feedback';
import DownloadIcon from '@mui/icons-material/Download';
import IconButton from '@mui/material/IconButton';

export default function PlanSelector({ animationTriggered, onPlanClick }) {


  //  HARD CODED PLANS - MUST CHANGE LATER
  const plans = ['Plan 1', 'Plan 2', 'Plan 3'];
  const [selectedPlan, setSelectedPlan] = React.useState(null);

  return (
    <Box
      sx={{
        bgcolor: 'grey.50',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: 2,
        width: '100%',
        height: '629px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 64px - 32px)',
      }}
    >
      {/* My Plans Header with animation */}
      <Grow in={animationTriggered} timeout={1000}>
        <Typography
          variant="h6"
          component="h1"
          sx={{
            fontWeight: 600,
            color: '#333',
            marginBottom: 1,
            paddingLeft: 0.5,
            fontSize: '1.1rem',
            textAlign: 'left',
            flexShrink: 0,
          }}
        >
          My Plans
        </Typography>
      </Grow>

      {/* Divider under My Plans */}
      <Divider sx={{ borderBottomWidth: 2, mb: 1.5, mt: 0.5, flexShrink: 0 }} />

      {/* Plan Buttons - Scrollable Container with smoother animation */}
      <Fade in={animationTriggered} timeout={1200}>
        <Box
          sx={{
            paddingLeft: 0.5,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            maxHeight: 'calc(100% - 120px)',
            paddingRight: 0.5,
          }}
        >
          {plans.map((plan, index) => (
            <Box
              key={index}
              onClick={() => {
                setSelectedPlan(plan); // Set as selected when clicking anywhere on the container
                onPlanClick && onPlanClick(plan);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '95%',
                marginBottom: 0.8,
                padding: '8px 8px',
                color: '#555',
                backgroundColor: selectedPlan === plan ? '#fff3e0' : 'transparent', // Light orange if selected
                border: selectedPlan === plan ? '2px solid #c47c1eff' : '1px solid #ddd', // Orange border if selected
                borderRadius: 1,
                flexShrink: 0,
                cursor: 'pointer',
                opacity: animationTriggered ? 1 : 0,
                transform: animationTriggered ? 'translateY(0)' : 'translateY(10px)',
                transition: `all 0.3s ease-in-out ${index * 100}ms`,
                '&:hover': {
                  backgroundColor: selectedPlan === plan ? '#ffe0b3' : '#e8e8e8', // Darker orange hover for selected
                  borderColor: selectedPlan === plan ? '#c47c1eff' : '#bbb',
                  transform: 'translateX(4px)',
                },
              }}
            >
              {/* Plan Button Content */}
              <Button
                startIcon={
                  <FolderIcon
                    sx={{
                      fontSize: '1rem',
                      color: selectedPlan === plan ? '#c47c1eff' : '#666' // Orange icon if selected
                    }}
                  />
                }
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  flex: 1,
                  padding: 0,
                  color: selectedPlan === plan ? '#c47c1eff' : 'inherit', // Orange text if selected
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 0,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: selectedPlan === plan ? 600 : 500, // Bold text if selected
                  minHeight: 'auto',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    '& .MuiSvgIcon-root': {
                      color: '#c47c1eff',
                    },
                  },
                  '& .MuiButton-startIcon': {
                    marginRight: 0.8,
                    marginLeft: 0,
                  },
                }}
              >
                {plan}
              </Button>

              {/* Download Icon */}
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`Download ${plan}`);
                }}
                sx={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                    '& .MuiSvgIcon-root': {
                      color: '#1976d2',
                    },
                  },
                }}
              >
                <DownloadIcon
                  sx={{
                    fontSize: '1.4rem',
                    color: '#888',
                    transition: 'color 0.2s ease-in-out',
                  }}
                />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Fade>

      {/* Website Assistance and Misc Buttons - at bottom */}
      <Box sx={{
        paddingTop: 2,
        borderTop: '1px solid #e0e0e0',
        marginTop: 'auto',
        flexShrink: 0,
      }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: '#666',
            marginBottom: 1,
            paddingLeft: 0.5,
            fontSize: '0.75rem',
          }}
        >
          Assistance
        </Typography>

        {[
          { name: 'Help Center', icon: HelpOutlineIcon },
          { name: 'Contact Support', icon: SupportAgentIcon },
          { name: 'Feedback', icon: FeedbackIcon }
        ].map((item, index) => {
          const IconComponent = item.icon;

          return (
            <Button
              key={index}
              onClick={() => {
                // ON CLICK ACTIONS NEEDED HERE FOR ASSISTANCE BUTTONS
                switch (item.name) {


                  case 'Help Center':
                    //  ADD HELP ACTION  
                    break;


                  case 'Contact Support':
                    //  ADD CONTACT SUPPORT ACTION
                    break;


                  case 'Feedback':
                    // ADD FEEDBACK ACTION
                    break;



                  default:
                    console.log(`${item.name} clicked`);
                }
              }}
              startIcon={
                <IconComponent
                  sx={{
                    fontSize: '0.9rem',
                    color: '#666'
                  }}
                />
              }
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '95%',
                marginBottom: 0.3,
                padding: '4px 8px',
                color: '#777',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 400,
                minHeight: '24px',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                  color: '#555',
                },
                '& .MuiButton-startIcon': {
                  marginRight: 0.6,
                  marginLeft: 0,
                },
              }}
            >
              {item.name}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}