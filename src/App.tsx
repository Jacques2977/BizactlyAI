import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import CofounderChat from './components/CofounderChat';

export default function App() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-gray-50 p-4">
        <CofounderChat />
      </main>
    </AuthProvider>
  );
}