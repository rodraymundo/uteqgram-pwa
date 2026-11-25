import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { notificationsSupported, requestNotificationPermission } from '../lib/notifications.js';

export default function Header({ showToast }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [permission, setPermission] = useState(
    notificationsSupported ? Notification.permission : 'unsupported'
  );

  async function handleNotifications() {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'denied') {
      showToast('Las notificaciones están bloqueadas en el navegador');
    }
  }

  const links = (
    <>
      <NavLink to="/" end className="nav-link" onClick={() => setMenuOpen(false)}>Feed</NavLink>
      <NavLink to="/help" className="nav-link" onClick={() => setMenuOpen(false)}>Help</NavLink>
      {notificationsSupported && (
        <button
          type="button"
          className="mdl-button mdl-button--raised mdl-button--colored mdl-color--accent enable-notifications"
          onClick={handleNotifications}
          disabled={permission === 'granted'}
        >
          {permission === 'granted' ? 'Notificaciones activadas' : 'Habilitar Notificaciones'}
        </button>
      )}
    </>
  );

  return (
    <>
      <header className="app-header">
        <button
          type="button"
          className="menu-button"
          aria-label="Abrir menú"
          onClick={() => setMenuOpen(true)}
        >
          <i className="material-icons">menu</i>
        </button>
        <span className="app-title">UTEQGram</span>
        <span className="spacer" />
        <nav className="nav-desktop">{links}</nav>
      </header>

      {menuOpen && <div className="drawer-backdrop" onClick={() => setMenuOpen(false)} />}
      <aside className={`drawer ${menuOpen ? 'open' : ''}`}>
        <span className="drawer-title">UTEQGram</span>
        <nav className="nav-drawer">{links}</nav>
      </aside>
    </>
  );
}
