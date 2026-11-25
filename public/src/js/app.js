var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

// INSTALACIÓN: se guarda el evento para mostrar el aviso de instalar después
window.addEventListener('beforeinstallprompt', function(event) {
  event.preventDefault();
  window.deferredPrompt = event;
  return false;
});

// REGISTRO DEL SERVICE WORKER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function() {
      console.log('Service Worker registered');
    })
    .catch(function(err) {
      console.log('Error al registrar el Service Worker:', err);
    });
}

// NOTIFICACIONES
// Muestra una notificación usando el Service Worker (funciona también con la app instalada)
function showLocalNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return Promise.resolve();
  }

  return navigator.serviceWorker.ready
    .then(function(swreg) {
      return swreg.showNotification(title, {
        body: body,
        icon: '/src/images/icons/app-icon-96x96.png',
        badge: '/src/images/icons/app-icon-96x96.png',
        vibrate: [100, 50, 200],
        lang: 'es-MX',
        tag: 'uteqgram',
        renotify: true,
        data: { url: '/' }
      });
    });
}

function displayConfirmNotification() {
  showLocalNotification(
    '¡Notificaciones activadas!',
    'Te avisaremos cuando tus publicaciones se sincronicen.'
  );
}

function updateNotificationButtons() {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    if (Notification.permission === 'granted') {
      enableNotificationsButtons[i].textContent = 'Notificaciones activadas';
    }
    enableNotificationsButtons[i].style.display = 'inline-block';
  }
}

function askForNotificationPermission() {
  Notification.requestPermission()
    .then(function(result) {
      console.log('Permiso de notificaciones:', result);

      if (result !== 'granted') {
        console.log('El usuario no dio permiso de notificaciones');
        return;
      }

      updateNotificationButtons();
      displayConfirmNotification();
    });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  updateNotificationButtons();
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
  }
} else {
  // El navegador no soporta notificaciones: se ocultan los botones
  for (var j = 0; j < enableNotificationsButtons.length; j++) {
    enableNotificationsButtons[j].style.display = 'none';
  }
}
