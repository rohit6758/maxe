import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Aggregator from './screens/Aggregator';
import Personals from './screens/Personals';
import Todos from './screens/Todos';
import Auth from './screens/Auth';
import Profile from './screens/Profile';
import Explore from './screens/Explore';
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
        for(let registration of registrations) { registration.unregister(); }
        window.location.reload(true);
      }).catch(function() { window.location.reload(true); });
    } else {
      window.location.reload(true);
    }
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-red-400 p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="text-xs p-4 rounded-xl overflow-auto border border-red-500/20 whitespace-pre-wrap" style={{background: 'rgba(8,25,65,0.5)'}}>
            {this.state.error?.stack || this.state.error?.message}
          </pre>
          <button onClick={this.handleReload} className="mt-4 px-4 py-2 text-white rounded-lg font-bold" style={{background: 'rgba(56,189,248,0.8)'}}>
            Hard Reload (Clear Cache)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAppContext();
  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4 animate-pulse" style={{background: '#EDF4F0'}}>
      <div className="w-16 h-16 rounded-full border-4 animate-spin" style={{borderColor: 'rgba(107,168,152,0.2)', borderTopColor: '#6BA898'}} />
      <p className="font-bold tracking-widest text-sm uppercase" style={{color: '#6BA898'}}>Loading Maxe</p>
    </div>
  );
  if (!session) return <Navigate to="/auth" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Aggregator />} />
        <Route path="personals" element={<Personals />} />
        <Route path="todos" element={<Todos />} />
        <Route path="explore" element={<Explore />} />
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
