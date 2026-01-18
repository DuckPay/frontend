import React, { useContext, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { ConnectionProvider, ConnectionContext } from './contexts/ConnectionContext';
import ConnectionIndicator from './components/ConnectionIndicator';

// Main app component with connection check
const AppContent = () => {
  const { isConnected } = useContext(ConnectionContext);
  
  // If not connected, show connection error page
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">未连接到服务器</h1>
          <p className="text-lg text-gray-600 mb-8">请检查您的网络连接并重试</p>
          <div className="animate-pulse">
            <p className="text-sm text-gray-500">正在尝试重新连接...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Normal app content when connected
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      </Routes>
    </div>
  );
};

// Root app component with connection provider and i18n Suspense
function App() {
  return (
    <ConnectionProvider>
      <Router>
        <Suspense fallback={
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-lg text-gray-600">加载中...</p>
            </div>
          </div>
        }>
          <AppContent />
        </Suspense>
      </Router>
    </ConnectionProvider>
  );
}

export default App;