import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Skills from './pages/Skills';
import Matches from './pages/Matches';
import Requests from './pages/Requests';
import Schedule from './pages/Schedule';
import History from './pages/History';
import Notifications from './pages/Notifications';
import Explore from './pages/Explore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

// Layout wrapper for authenticated pages (Navbar + Sidebar + content)
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      {isAuthenticated ? (
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0, padding: '2rem', overflowX: 'hidden' }}>
            {children}
          </main>
        </div>
      ) : (
        <main>{children}</main>
      )}
    </div>
  );
};

// Public layout (Navbar only, no sidebar)
const PublicLayout = ({ children }) => (
  <div style={{ minHeight: '100vh' }}>
    <Navbar />
    <main>{children}</main>
  </div>
);

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
    <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
    <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />

    {/* Protected routes */}
    <Route path="/dashboard" element={
      <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
    } />
    <Route path="/profile/:id" element={
      <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
    } />
    <Route path="/skills" element={
      <ProtectedRoute><AppLayout><Skills /></AppLayout></ProtectedRoute>
    } />
    <Route path="/matches" element={
      <ProtectedRoute><AppLayout><Matches /></AppLayout></ProtectedRoute>
    } />
    <Route path="/requests" element={
      <ProtectedRoute><AppLayout><Requests /></AppLayout></ProtectedRoute>
    } />
    <Route path="/schedule" element={
      <ProtectedRoute><AppLayout><Schedule /></AppLayout></ProtectedRoute>
    } />
    <Route path="/history" element={
      <ProtectedRoute><AppLayout><History /></AppLayout></ProtectedRoute>
    } />
    <Route path="/notifications" element={
      <ProtectedRoute><AppLayout><Notifications /></AppLayout></ProtectedRoute>
    } />
    <Route path="/explore" element={
      <ProtectedRoute><AppLayout><Explore /></AppLayout></ProtectedRoute>
    } />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#e2e8f0',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '12px',
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
