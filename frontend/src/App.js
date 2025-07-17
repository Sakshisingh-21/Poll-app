import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminRegister from './pages/AdminRegister';
import PollList from './pages/PollList';
import PollDetail from './pages/PollDetail';
import CreatePoll from './pages/CreatePoll';
import EditPoll from './pages/EditPoll';
import PollResultsPage from './pages/PollResultsPage';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navigation />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/admin" element={<AdminRegister />} />
            <Route path="/polls" element={<PollList />} />
            <Route path="/polls/:id" element={<PollDetail />} />
            <Route path="/polls/:id/edit" element={<EditPoll />} />
            <Route path="/polls/:id/results" element={<PollResultsPage />} />
            
            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/polls/create" 
              element={
                <AdminRoute>
                  <CreatePoll />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/polls/:id/edit" 
              element={
                <AdminRoute>
                  <EditPoll />
                </AdminRoute>
              } 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App; 
