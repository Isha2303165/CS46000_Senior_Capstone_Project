import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import Divider from '@mui/material/Divider';
import SitemarkIcon from './components/SitemarkIcon';
import Chip from '@mui/material/Chip';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import Footer from '../marketing-page/components/Footer';
import AppTheme from '../shared-theme/AppTheme';
import CssBaseline from '@mui/material/CssBaseline';
import Card from '@mui/material/Card';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Grow from '@mui/material/Grow';

export default function Profile() {
    const [editMode, setEditMode] = useState({ name: false, email: false });
    const [edited, setEdited] = useState(false);

    const navigate = useNavigate();




    // --------------PROFILE EDITING FUNCTIONS--------------

    const handleEdit = (field) => {
        setEditMode((prev) => ({ ...prev, [field]: true }));
    };

    const handleChange = (field, value) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
        setEdited(true);
    };

    const handleSave = (field) => {
        setEditMode((prev) => ({ ...prev, [field]: false }));
    };








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



    useEffect(() => {
        const interval = setInterval(() => {

            const token = localStorage.getItem('token');
            if (!checkTokenValidity(token)) {
                navigate('/signin');
            }

        }, 2000); // checks every 2 seconds

        return () => clearInterval(interval);

    }, [checkTokenValidity, navigate]);




    const token = localStorage.getItem('token');
    const [profile, setProfile] = useState(getUserFromToken(token));







    // --------------UPDATE PROFILE--------------
    const handleUpdateProfile = async () => {
        setEdited(false);
        setEditMode({ name: false, email: false });

        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }
        const userFromToken = getUserFromToken(token);


        const uploadToBackend = {};
        if (profile.name) {
            uploadToBackend.new_name = profile.name;
        }
        if (profile.email) {
            uploadToBackend.new_email = profile.email;
        }



        try {
            const response = await fetch('http://localhost:7001/userauth/updateUser', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(uploadToBackend),
            });


            if (!response.ok) {
                const error = await response.json();
                alert(error.detail || 'Failed to update profile.');
                return;
            }


            const newToken = await response.json();


            if (newToken.new_token) {
                localStorage.setItem('token', newToken.new_token);
                setProfile(getUserFromToken(newToken.new_token));
            }
        }
        catch (error) {
            alert('An error occurred.');
            console.log('The try block broke.');
        }
    };









    return (
        <AppTheme>
            <CssBaseline enableColorScheme />

            <Box
                sx={{
                    minHeight: '100vh',
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: '#f5f5f5',
                }}
            >

                {/* Back Arrow */}
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        mt: { xs: 2, md: 4 },
                        ml: { xs: 1, md: 8 },
                    }}
                >
                    <IconButton
                        onClick={() => navigate('/myplans')}
                        sx={{
                            color: '#c47c1eff',
                            bgcolor: '#fff',
                            boxShadow: 2,
                            borderRadius: 2,
                            '&:hover': { bgcolor: '#ffe0b3' }
                        }}
                        aria-label="Back to home"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </Box>





                {/* Profile Card */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Grow in={true} timeout={700}>
                        <Card
                            sx={{
                                maxWidth: 420,
                                width: '100%',
                                mx: 'auto',
                                mt: 2,
                                p: 4,
                                borderRadius: 4,
                                boxShadow: 6,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                bgcolor: '#fff',
                            }}
                        >
                            {/* Large Profile Icon */}
                            <Box
                                sx={{
                                    bgcolor: '#fff3e0',
                                    color: '#c47c1eff',
                                    width: 96,
                                    height: 96,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2,
                                    fontSize: 64,
                                    boxShadow: 2,
                                }}
                            >
                                <PersonIcon sx={{ fontSize: 64 }} />
                            </Box>

                            <Typography variant="h5" fontWeight={700} textAlign="center" mb={2} color="#c47c1eff">
                                Profile
                            </Typography>

                            {/* Name Field */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', px: 1, py: 1 }}>
                                <PersonIcon sx={{ color: '#c47c1eff' }} />
                                {editMode.name ? (
                                    <>
                                        <TextField
                                            value={profile.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            size="small"
                                            variant="standard"
                                            sx={{ flex: 1, input: { color: '#a05e13' } }}
                                            autoFocus
                                        />
                                        <IconButton onClick={() => handleSave('name')} color="success">
                                            <SaveIcon />
                                        </IconButton>
                                    </>
                                ) : (
                                    <>
                                        <Typography sx={{ flex: 1, color: '#a05e13', fontWeight: 500 }}>{profile.name}</Typography>
                                        <IconButton onClick={() => handleEdit('name')} sx={{ color: '#c47c1eff' }}>
                                            <EditIcon />
                                        </IconButton>
                                    </>
                                )}
                            </Box>

                            <Divider sx={{ width: '90%', mx: 'auto', bgcolor: '#ffe0b3', my: -1 }} />

                            {/* Email Field */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', px: 1, py: 1 }}>
                                <EmailIcon sx={{ color: '#c47c1eff' }} />
                                {editMode.email ? (
                                    <>
                                        <TextField
                                            value={profile.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            size="small"
                                            variant="standard"
                                            sx={{ flex: 1, input: { color: '#a05e13' } }}
                                            autoFocus
                                        />
                                        <IconButton onClick={() => handleSave('email')} color="success">
                                            <SaveIcon />
                                        </IconButton>
                                    </>
                                ) : (
                                    <>
                                        <Typography sx={{ flex: 1, color: '#a05e13', fontWeight: 500 }}>{profile.email}</Typography>
                                        <IconButton onClick={() => handleEdit('email')} sx={{ color: '#c47c1eff' }}>
                                            <EditIcon />
                                        </IconButton>
                                    </>
                                )}
                            </Box>






                            {/* Update Profile Button */}
                            <Button
                                variant="contained"
                                fullWidth
                                disabled={!edited}
                                sx={{
                                    mt: 3,
                                    bgcolor: edited ? '#c47c1eff' : '#ffe0b3',
                                    color: edited ? '#fff' : '#a05e13',
                                    fontWeight: 600,
                                    boxShadow: edited ? 2 : 0,
                                    transition: 'all 0.2s',
                                    maxWidth: 300,
                                }}
                                onClick={handleUpdateProfile}
                            >
                                Update Profile
                            </Button>








                            {/* Subscription Area */}
                            <Box
                                sx={{
                                    width: '100%',
                                    maxWidth: 350,
                                    mx: 'auto',
                                    my: 6,
                                    p: 2,
                                    bgcolor: '#fff3e0',
                                    borderRadius: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    boxShadow: 1,
                                    gap: 1.5,
                                }}
                            >
                                <CardMembershipIcon sx={{ color: '#c47c1eff', fontSize: 36, mb: 1 }} />
                                <Typography variant="subtitle1" fontWeight={600} color="#a05e13">
                                    Current Subscription
                                </Typography>
                                <Typography variant="body1" color="#333">
                                    Premium Plan
                                </Typography>
                                <Chip
                                    label="Active"
                                    color="success"
                                    size="small"
                                    sx={{ fontWeight: 600, mt: 0.5 }}
                                />
                                <Button
                                    variant="outlined"
                                    startIcon={<CreditCardIcon />}
                                    sx={{
                                        mt: 1,
                                        borderColor: '#c47c1eff',
                                        color: '#c47c1eff',
                                        fontWeight: 600,
                                        '&:hover': {
                                            backgroundColor: '#ffe0b3',
                                            borderColor: '#a05e13',
                                            color: '#a05e13',
                                        },
                                    }}
                                    onClick={() => alert('Manage subscription coming soon!')}
                                >
                                    Manage Subscription
                                </Button>
                            </Box>
                        </Card>
                    </Grow>
                </Box>







                {/* Footer Card */}
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        pb: 3,
                        px: 2,
                        mt: 4,
                    }}
                >

                    <Card
                        sx={{
                            width: '100%',
                            maxWidth: 900,
                            borderRadius: 4,
                            boxShadow: 6,
                            bgcolor: '#fff',
                            p: 2,
                        }}
                    >
                        <Footer />
                    </Card>
                </Box>




            </Box>
        </AppTheme>
    );
}