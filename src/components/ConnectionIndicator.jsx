import React, { useContext } from 'react';
import { ConnectionContext } from '../contexts/ConnectionContext';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Connection status indicator component
const ConnectionIndicator = () => {
  const { isConnected, isChecking } = useContext(ConnectionContext);
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center space-x-1 text-sm font-medium">
      {isChecking ? (
        // Checking state
        <div className="flex items-center space-x-1 text-yellow-600">
          <RefreshCw className="inline-block w-4 h-4 animate-spin" />
          <span>{t('common.connectionStatus.connecting')}</span>
        </div>
      ) : isConnected ? (
        // Connected state
        <div className="flex items-center space-x-1 text-green-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>{t('common.connectionStatus.connected')}</span>
        </div>
      ) : (
        // Disconnected state
        <div className="flex items-center space-x-1 text-red-600">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>{t('common.connectionStatus.disconnected')}</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionIndicator;
