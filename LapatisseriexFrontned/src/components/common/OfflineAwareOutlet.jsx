import React from 'react';
import { Outlet } from 'react-router-dom';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import OfflinePage from '../common/OfflinePage';

const OfflineAwareOutlet = () => {
  const { isOnline } = useNetworkStatus();

  // If offline and no service worker controller, show offline page instead of routes
  if (!isOnline && !navigator.serviceWorker.controller) {
    return <OfflinePage />;
  }

  // If online or service worker is available, show normal routes
  return <Outlet />;
};

export default OfflineAwareOutlet;