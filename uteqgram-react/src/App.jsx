import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import Feed from './pages/Feed.jsx';
import Help from './pages/Help.jsx';

export default function App() {
  const [toast, setToast] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);

  const showToast = useCallback((message) => {
    setToast({ message, key: Date.now() });
  }, []);

  // Indicador de conexión
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="app">
      <Header showToast={showToast} />
      {!online && <div className="offline-banner">Sin conexión: estás viendo datos guardados</div>}
      <main className="content">
        <Routes>
          <Route path="/" element={<Feed showToast={showToast} />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toast toast={toast} onHide={() => setToast(null)} />
    </div>
  );
}
