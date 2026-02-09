
import React, { useContext } from 'react';
import LoginScreen from './components/auth/LoginScreen';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthProvider';
import { AuthContext } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

const AppContent: React.FC = () => {
  const { user } = useContext(AuthContext);
  return (
    <div className="bg-gray-100 min-h-screen">
      {user ? <Layout /> : <LoginScreen />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
