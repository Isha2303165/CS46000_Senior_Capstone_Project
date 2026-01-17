import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Zoom from '@mui/material/Zoom';
import SitemarkIcon from './components/SitemarkIcon';
import { useEffect } from 'react';



export default function ProtectedRoute({ children }) {
    const navigate = useNavigate();
    const [show, setShow] = React.useState(false);



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





    // --------------USEEFFECT FOR PAGE RE-RENDERS IF TOKEN IS BAD--------------
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');

            // Trigger re-render if bad token.
            setShow(!checkTokenValidity(token));
        };

        // Check if token is vaild once.
        checkAuth();
        const interval = setInterval(checkAuth, 2000); // Repeat check.
        return () => clearInterval(interval);
    }, []);



    return (
        <>
        
            {children}

            {/* If token is bad, render protector. Else, don't render. */}
            {show && ( 
                <div
                    style={{
                        position: 'fixed',
                        zIndex: 2000,
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(255,255,255,0.8)', // or even lower
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto',
                    }}
                >
                    <Zoom in={show} style={{ transitionDelay: show ? '100ms' : '0ms' }}>

                        <div
                            style={{
                                textAlign: 'center',
                                color: '#333',
                                background: 'white',
                                borderRadius: 16,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                padding: '48px 32px',
                                minWidth: 320,
                                maxWidth: '90vw',
                                animation: 'mui-bounce 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
                            }}
                        >


                            <style>
                                {`
                                    @keyframes mui-bounce {
                                    0% { transform: scale(0.5); opacity: 0; }
                                    60% { transform: scale(1.1); opacity: 1; }
                                    80% { transform: scale(0.95); }
                                    100% { transform: scale(1); }
                                }
                                `}
                            </style>



                            <div style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 24 }}>
                                Please log in to use this feature of
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    fontSize: '2rem',
                                    fontWeight: 600,
                                    marginBottom: 24,
                                }}
                            >
                                <SitemarkIcon></SitemarkIcon>
                            </div>


                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate('/signin')}
                                sx={{
                                    fontSize: '1.1rem',
                                    fontWeight: 500,
                                    backgroundColor: '#c47c1eff',
                                    '&:hover': { backgroundColor: '#a05e13' }
                                }}                            >
                                Go to Sign In
                            </Button>
                        </div>
                    </Zoom>
                </div>
            )}
        </>
    );
}