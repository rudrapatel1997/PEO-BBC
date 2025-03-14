import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import CheckIn from './pages/CheckIn';
import Scoring from './pages/Scoring';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/check-in"
          element={
            <PrivateRoute allowedRoles={['volunteer', 'admin']}>
              <CheckIn />
            </PrivateRoute>
          }
        />
        <Route
          path="/scoring"
          element={
            <PrivateRoute allowedRoles={['judge', 'admin']}>
              <Scoring />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={
            <Navigate
              to={
                user?.role === 'admin'
                  ? '/dashboard'
                  : user?.role === 'judge'
                  ? '/scoring'
                  : '/check-in'
              }
            />
          }
        />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router basename={process.env.PUBLIC_URL}>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 