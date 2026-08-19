import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Aggregator from './screens/Aggregator';
import PostMortemLog from './screens/PostMortemLog';
import ExamProgression from './screens/ExamProgression';
import Todos from './screens/Todos';
import Auth from './screens/Auth';
import Profile from './screens/Profile';
import { AppProvider, useAppContext } from './context/AppContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAppContext();
  
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-background text-header">Loading...</div>;
  if (!session) return <Navigate to="/auth" />;
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Aggregator />} />
        <Route path="logs" element={<PostMortemLog />} />
        <Route path="timeline" element={<ExamProgression />} />
        <Route path="todos" element={<Todos />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
