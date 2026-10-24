import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Feed from './components/Feed';
import AuthModal from './components/AuthModal';
import NotificationDrawer from './components/NotificationDrawer';
import { AuthProvider } from './context/AuthContext';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenNotifications={() => setNotificationOpen(true)}
        />
        <Feed
          activeTab={activeTab}
          onRequireAuth={() => setAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
        <NotificationDrawer
          isOpen={notificationOpen}
          onClose={() => setNotificationOpen(false)}
        />
      </div>
    </AuthProvider>
  );
}
