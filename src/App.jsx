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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  handleReload = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
        window.location.reload(true);
      }).catch(function() {
        window.location.reload(true);
      });
    } else {
      window.location.reload(true);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-red-400 p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="text-xs bg-surface p-4 rounded-xl overflow-auto border border-[#1e293b] whitespace-pre-wrap">
            {this.state.error?.stack || this.state.error?.message}
          </pre>
          <button onClick={this.handleReload} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Hard Reload (Clear Cache)</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
