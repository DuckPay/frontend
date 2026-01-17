import React, { createContext, useState, useEffect, useCallback } from 'react';
import { logout } from '../utils/auth';
import api from '../utils/auth';

// Create connection context
export const ConnectionContext = createContext();

// Connection context provider component
export const ConnectionProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  
  // Ping backend to check connection status
  const checkConnection = useCallback(async () => {
    try {
      setIsChecking(true);
      // Use a separate axios instance to avoid token issues
      const response = await fetch('/api/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 3000,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'pong') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);
  
  // Check connection on mount and every 5 seconds
  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Set up interval for periodic checks
    const interval = setInterval(() => {
      checkConnection();
    }, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [checkConnection]);
  
  // Effect to handle connection loss
  useEffect(() => {
    if (!isConnected) {
      // Clear login state when disconnected
      logout();
    }
  }, [isConnected]);
  
  return (
    <ConnectionContext.Provider value={{ isConnected, isChecking }}>
      {children}
    </ConnectionContext.Provider>
  );
};
