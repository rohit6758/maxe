import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Aggregator from './screens/Aggregator';
import Personals from './screens/Personals';
import Auth from './screens/Auth';
import Profile from './screens/Profile';
import Explore from './screens/Explore';
import UserSearch from './screens/UserSearch';
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
    <div className="h-screen w-full flex flex-col items-center justify-center overflow-hidden relative" style={{background: '#EDF4F0'}}>
      {/* Decorative floating blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none animate-pulse" style={{background:'rgba(107,168,152,0.08)', transform:'translate(30%,-30%)', animationDuration: '3s'}} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none animate-pulse" style={{background:'rgba(168,197,184,0.15)', transform:'translate(-30%,30%)', animationDuration: '4s'}} />
      
      {/* Main Logo Box */}
      <div className="relative z-10 flex flex-col items-center animate-slide-up">
        <div className="relative">
          <img src="/logo.png" alt="Maxe Logo" className="w-24 h-24 mx-auto rounded-3xl shadow-2xl relative z-10 animate-bounce" style={{animationDuration: '2s'}} />
          {/* Glowing shadow behind logo */}
          <div className="absolute inset-0 bg-[#6BA898] rounded-3xl blur-xl opacity-40 animate-pulse"></div>
        </div>
        
        <h1 className="text-4xl font-black mt-6 tracking-tight text-aberration" style={{color:'#2D4A3E'}}>Maxe</h1>
        
        {/* Sleek Progress Bar */}
        <div className="w-32 h-1.5 rounded-full mt-6 overflow-hidden" style={{background: 'rgba(107,168,152,0.2)'}}>
          <div className="h-full rounded-full" style={{background: '#6BA898', width: '40%', animation: 'loadingBar 1.5s infinite ease-in-out alternate'}}></div>
        </div>
        
        <p className="font-bold tracking-[0.2em] text-[10px] uppercase mt-4 animate-pulse" style={{color: '#5E7A6E'}}>Preparing your workspace</p>
      </div>
      
      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
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
        <Route path="search" element={<UserSearch />} />
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
