import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppBar from './app-bar/AppBar'; // make sure this matches your filename
import MarketingPage from './marketing-page/MarketingPage';
import SignIn from './sign-in/SignIn';
import SignUp from './sign-up/SignUp';
import PlannerBot from './planner-bot/PlannerBot'; // PlannerBot page
import MyPlans from './my-plans/MyPlans'; // <-- import MyPlans page
import ProtectedRoute from './protected-route/ProtectedRoute';
import Profile from './profile/Profile';

function App() {
  return (
    <>
      <Routes>
        {/* Default route now goes to MarketingPage */}
        <Route path="/" element={<MarketingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/plannerbot" element={<ProtectedRoute>  <PlannerBot /> </ProtectedRoute>} /> {/* PlannerBot route PROTECTED */}
        <Route path="/myplans" element={<ProtectedRoute>  <MyPlans />  </ProtectedRoute>} /> {/* <-- MyPlans route PROTECTED */}
        <Route path="/profile" element={<Profile />} />
        {/* Add more routes here as needed */}
      </Routes>
    </>
  );
}

export default App;
