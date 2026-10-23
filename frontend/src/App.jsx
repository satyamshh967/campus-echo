import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Feed from './components/Feed';
import AuthModal from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';
import './App.css';

export default function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar onOpenAuth={() => setAuthModalOpen(true)} />
        <Feed onRequireAuth={() => setAuthModalOpen(true)} />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    </AuthProvider>
  );
}
