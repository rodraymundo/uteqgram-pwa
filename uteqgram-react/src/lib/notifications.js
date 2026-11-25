// Notificaciones del sistema (a través del Service Worker cuando existe)
export const notificationsSupported =
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

export async function showLocalNotification(title, body) {
  if (!notificationsSupported || Notification.permission !== 'granted') {
    return;
  }

  const options = {
    body,
    icon: '/icons/app-icon-96x96.png',
    badge: '/icons/app-icon-96x96.png',
    vibrate: [100, 50, 200],
    lang: 'es-MX',
    tag: 'uteqgram',
    renotify: true,
    data: { url: '/' }
  };

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.showNotification(title, options);
  } else {
    // En modo desarrollo no hay Service Worker
    new Notification(title, options);
  }
}

export async function requestNotificationPermission() {
  if (!notificationsSupported) {
    return 'unsupported';
  }

  const result = await Notification.requestPermission();
  if (result === 'granted') {
    await showLocalNotification(
      '¡Notificaciones activadas!',
      'Te avisaremos cuando tus publicaciones se sincronicen.'
    );
  }
  return result;
}
