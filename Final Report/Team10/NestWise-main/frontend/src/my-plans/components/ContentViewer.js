import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Grow from '@mui/material/Grow';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

export default function ContentViewer({
    animationTriggered = true,
    pdfUrl,
    leftData = {},
    rightData = {},
    topBoxHeight = 400,
    bottomBoxHeight = 250
}) {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
                padding: 2,
            }}
        >
            {/* Top Box - PDF Viewer */}
            <Grow in={animationTriggered} timeout={1000}>
                <Box
                    sx={{
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        padding: 2,
                        height: `${topBoxHeight}px`,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* PDF Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PictureAsPdfIcon sx={{ color: '#666', mr: 1 }} />
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: '#333',
                                fontSize: '1.1rem',
                            }}
                        >
                            Document Viewer
                        </Typography>
                    </Box>

                    <Divider sx={{ borderBottomWidth: 2, mb: 2 }} />

                    {/* PDF Content Area */}
                    <Box
                        sx={{
                            flex: 1,
                            backgroundColor: '#f9f9f9',
                            borderRadius: 1,
                            border: '1px solid #ddd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        {pdfUrl && pdfUrl !== "path/to/your/document.pdf" && pdfUrl.trim() !== "" ? (
                            <iframe
                                src={pdfUrl}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                }}
                                title="PDF Viewer"
                                sandbox="allow-same-origin allow-scripts"
                                onError={() => console.log('PDF failed to load')}
                            />
                        ) : (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#666',
                                textAlign: 'center'
                            }}>
                                <PictureAsPdfIcon sx={{ fontSize: 48, mb: 2, color: '#ccc' }} />
                                <Typography variant="body1" color="text.secondary" gutterBottom>
                                    No PDF Document Found
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Select a plan to view the associated document
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Grow>

            {/* Bottom Row - Two Data Boxes */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 2,
                    height: `${bottomBoxHeight}px`,
                }}
            >
                {/* Left Data Box */}
                <Grow in={animationTriggered} timeout={1200}>
                    <Box
                        sx={{
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            padding: 2,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Left Box Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <BarChartIcon sx={{ color: '#666', mr: 1 }} />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#333',
                                    fontSize: '1rem',
                                }}
                            >
                                Analytics
                            </Typography>
                        </Box>

                        <Divider sx={{ borderBottomWidth: 2, mb: 2 }} />

                        {/* Left Data Content - Scrollable */}
                        <Box sx={{
                            flex: 1,
                            overflow: 'auto',
                        }}>
                            {Object.entries(leftData).length > 0 ? (
                                Object.entries(leftData).map(([key, value], index) => (
                                    <Box key={index} sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {key}
                                        </Typography>
                                        <Typography variant="body1" fontWeight={500}>
                                            {value}
                                        </Typography>
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No data available
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Grow>

                {/* Right Data Box */}
                <Grow in={animationTriggered} timeout={1400}>
                    <Box
                        sx={{
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            padding: 2,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Right Box Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TrendingUpIcon sx={{ color: '#666', mr: 1 }} />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#333',
                                    fontSize: '1rem',
                                }}
                            >
                                Performance
                            </Typography>
                        </Box>

                        <Divider sx={{ borderBottomWidth: 2, mb: 2 }} />

                        {/* Right Data Content - Scrollable */}
                        <Box sx={{
                            flex: 1,
                            overflow: 'auto',
                        }}>
                            {Object.entries(rightData).length > 0 ? (
                                Object.entries(rightData).map(([key, value], index) => (
                                    <Box key={index} sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {key}
                                        </Typography>
                                        <Typography variant="body1" fontWeight={500}>
                                            {value}
                                        </Typography>
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No data available
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Grow>
            </Box>

            {/* Button to edit plan!! */}
            <Button
                variant="contained"
                color="primary"
                size="small"
                fullWidth
                sx={{
                    mt: 1,
                    backgroundColor: '#c47c1eff',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    maxWidth: '400px',
                    alignSelf: 'center',
                    '&:hover': {
                        backgroundColor: '#a05e13',
                    },
                }}
                onClick={() => {
                    navigate('/plannerbot');
                    console.log('Edit Plan in Planner Bot clicked');
                }}
            >
                Edit Plan in Planner Bot
            </Button>
        </Box>
    );
}