import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Zoom from '@mui/material/Zoom';
import Button from '@mui/material/Button';
import FolderIcon from '@mui/icons-material/Folder';
import DownloadIcon from '@mui/icons-material/Download';
import IconButton from '@mui/material/IconButton';

export default function PlanSelector({
  animationTriggered,
  selectedPlan,
  setSelectedPlan,
  onPlanClick
}) {
  const plans = ['Plan 1', 'Plan 2', 'Plan 3'];

  return (
    <Box
      sx={{
        bgcolor: 'grey.50',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: 2,
        height: '225px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" sx={{ mb: 0.01, textAlign: 'left', width: '100%' }}>
        Select Plan To Edit
      </Typography>



      <Divider sx={{ borderBottomWidth: 2, mb: 1, mt: 1 }} />



      {/* Plan Buttons */}
      <Box sx={{ overflowY: 'auto', maxHeight: '100%', mb: 1 }}>
        {plans.map((plan, index) => (
          <Box
            key={index}
            onClick={() => {
              setSelectedPlan(plan);
              onPlanClick && onPlanClick(plan);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '95%',
              marginBottom: 0.8,
              padding: '8px 8px',
              color: '#555',
              backgroundColor: selectedPlan === plan ? '#fff3e0' : 'transparent',
              border: selectedPlan === plan ? '2px solid #c47c1eff' : '1px solid #ddd',
              borderRadius: 1,
              flexShrink: 0,
              cursor: 'pointer',
              opacity: animationTriggered ? 1 : 0,
              transform: animationTriggered ? 'translateY(0)' : 'translateY(10px)',
              transition: `all 0.3s ease-in-out ${index * 100}ms`,
              '&:hover': {
                backgroundColor: selectedPlan === plan ? '#ffe0b3' : '#e8e8e8',
                borderColor: selectedPlan === plan ? '#c47c1eff' : '#bbb',
                transform: 'translateX(4px)',
              },
            }}
          >
            <Button
              startIcon={
                <FolderIcon
                  sx={{
                    fontSize: '1rem',
                    color: selectedPlan === plan ? '#c47c1eff' : '#666'
                  }}
                />
              }
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                flex: 1,
                padding: 0,
                color: selectedPlan === plan ? '#c47c1eff' : 'inherit',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: 0,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: selectedPlan === plan ? 600 : 500,
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
            <IconButton
              onClick={e => {
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
    </Box>
  );
}