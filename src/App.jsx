import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { RealtimeApprovalModal } from './components/notifications/RealtimeApprovalModal';

const MainContent = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <SocketProvider>
      <DashboardLayout />
      <RealtimeApprovalModal />
    </SocketProvider>
  ) : (
    <LoginPage />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
