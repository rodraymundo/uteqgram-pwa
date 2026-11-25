var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');

// Elementos de la cámara y la ubicación
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var imagePreview = document.querySelector('#image-preview');
var locationButton = document.querySelector('#location-btn');

var SUPABASE_URL = 'https://oxszjpoaxbuhmpuoclga.supabase.co';
var SUPABASE_KEY = 'sb_publishable_d-Y4P4YYg-VA-tx7M4UgEA_foxknNch';
var DEFAULT_IMAGE = SUPABASE_URL + '/storage/v1/object/public/posts/sf-boat.jfif';

var url = SUPABASE_URL + '/rest/v1/post?select=*';
var options = {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  }
};

var picture = null;     // foto tomada (data URL en JPEG)
var mediaStream = null; // flujo de la cámara

function showNotification(message) {
  var snackbarContainer = document.querySelector('#confirmation-toast');

  if (snackbarContainer && snackbarContainer.MaterialSnackbar) {
    snackbarContainer.MaterialSnackbar.showSnackbar({ message: message });
  } else {
    console.log(message);
  }
}

// ---------- CÁMARA ----------

function initializeMedia() {
  if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
    // Sin soporte de cámara: se usa el selector de archivos
    imagePickerArea.style.display = 'block';
    captureButton.style.display = 'none';
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    .then(function(stream) {
      mediaStream = stream;
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
      captureButton.style.display = 'inline-block';
      imagePickerArea.style.display = 'block';
    })
    .catch(function(err) {
      console.log('No se pudo usar la cámara:', err);
      imagePickerArea.style.display = 'block';
      captureButton.style.display = 'none';
    });
}

function stopMedia() {
  if (mediaStream) {
    mediaStream.getVideoTracks().forEach(function(track) {
      track.stop();
    });
    mediaStream = null;
  }
  videoPlayer.srcObject = null;
  videoPlayer.style.display = 'none';
}

// Dibuja una imagen o video en el canvas con ancho máximo de 480 px y regresa un JPEG ligero
function drawToCanvas(source, width, height) {
  var maxWidth = 480;
  var scale = width > maxWidth ? maxWidth / width : 1;
  canvasElement.width = Math.round(width * scale);
  canvasElement.height = Math.round(height * scale);
  var context = canvasElement.getContext('2d');
  context.drawImage(source, 0, 0, canvasElement.width, canvasElement.height);
  return canvasElement.toDataURL('image/jpeg', 0.7);
}

function showPreview(dataUrl) {
  picture = dataUrl;
  imagePreview.src = dataUrl;
  imagePreview.style.display = 'block';
}

captureButton.addEventListener('click', function() {
  picture = drawToCanvas(videoPlayer, videoPlayer.videoWidth, videoPlayer.videoHeight);
  showPreview(picture);
  stopMedia();
  captureButton.style.display = 'none';
});

imagePicker.addEventListener('change', function(event) {
  var file = event.target.files[0];
  if (!file) {
    return;
  }

  var reader = new FileReader();
  reader.onload = function() {
    var img = new Image();
    img.onload = function() {
      showPreview(drawToCanvas(img, img.width, img.height));
      stopMedia();
      captureButton.style.display = 'none';
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

// ---------- UBICACIÓN (GPS) ----------

if (!('geolocation' in navigator)) {
  locationButton.style.display = 'none';
}

locationButton.addEventListener('click', function() {
  locationButton.disabled = true;

  navigator.geolocation.getCurrentPosition(function(position) {
    locationButton.disabled = false;
    locationInput.value = 'Lat ' + position.coords.latitude.toFixed(4) +
      ', Lng ' + position.coords.longitude.toFixed(4);
    locationInput.parentElement.classList.add('is-dirty');
  }, function(err) {
    locationButton.disabled = false;
    console.log(err);
    showNotification('No se pudo obtener la ubicación, escríbela manualmente');
  }, { timeout: 10000 });
});

// ---------- MODAL ----------

function resetForm() {
  picture = null;
  imagePreview.style.display = 'none';
  imagePreview.removeAttribute('src');
  imagePicker.value = '';
  imagePickerArea.style.display = 'none';
  captureButton.style.display = 'none';
}

function openCreatePostModal() {
  createPostArea.style.transform = 'translateY(0)';
  resetForm();
  initializeMedia();

  if (window.deferredPrompt) {
    window.deferredPrompt.prompt();
    window.deferredPrompt.userChoice.then(function(choiceResult) {
      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });
    window.deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  stopMedia();
  createPostArea.style.transform = 'translateY(100vh)';
}

shareImageButton.addEventListener('click', openCreatePostModal);
closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// ---------- TARJETAS (vista generada del lado del cliente) ----------

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data, pending) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp' + (pending ? ' pending-card' : '');

  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("' + (data.image || DEFAULT_IMAGE) + '")';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.backgroundPosition = 'center';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);

  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.style.textShadow = '0 1px 3px rgba(0,0,0,0.8)';
  cardTitle.appendChild(cardTitleTextElement);

  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = pending ? data.location + ' (pendiente de sincronizar)' : data.location;
  cardSupportingText.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText);

  if (typeof componentHandler !== 'undefined') {
    componentHandler.upgradeElement(cardWrapper);
  }

  sharedMomentsArea.insertBefore(cardWrapper, pending ? sharedMomentsArea.firstChild : null);
}

function updateUI(data) {
  clearCards();

  if (!data || !Array.isArray(data)) {
    return;
  }

  // Las publicaciones más recientes primero
  var sorted = data.slice().sort(function(a, b) {
    return String(b.id).localeCompare(String(a.id));
  });

  for (var i = 0; i < sorted.length; i++) {
    createCard(sorted[i]);
  }
}

// ---------- DATOS: remoto (Supabase), local (IndexedDB) ----------

var networkDataReceived = false;

function loadPosts() {
  return fetch(url, options)
    .then(function(res) {
      return res.json();
    });
}

// 1) Datos remotos
loadPosts()
  .then(function(data) {
    networkDataReceived = true;
    console.log('From web', data);
    updateUI(data);
  })
  .catch(function(err) {
    console.log('Sin conexión, se usan los datos locales', err);
  });

// 2) Datos locales guardados en IndexedDB (sirven sin conexión)
if ('indexedDB' in window) {
  readAllData('posts')
    .then(function(data) {
      if (!networkDataReceived && data && data.length) {
        console.log('From IndexedDB', data);
        updateUI(data);
      }
    });
}

// Mensaje del Service Worker cuando termina la sincronización
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data && event.data.action === 'updateUI') {
      loadPosts()
        .then(function(data) {
          console.log('Actualizando publicaciones:', data);
          updateUI(data);
          showNotification('Publicaciones sincronizadas correctamente');
        })
        .catch(function(err) {
          console.log('Error al actualizar publicaciones:', err);
        });
    }
  });
}

// Envío directo cuando el navegador no soporta Background Sync
function sendData(post) {
  fetch(SUPABASE_URL + '/rest/v1/post', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(post)
  })
    .then(function(res) {
      if (!res.ok) {
        throw new Error('Error al guardar publicación: ' + res.status);
      }
      return loadPosts();
    })
    .then(function(data) {
      updateUI(data);
      showNotification('Publicación guardada correctamente');
      if (typeof showLocalNotification === 'function') {
        showLocalNotification('Publicación enviada', '"' + post.title + '" ya está en UTEQGram');
      }
    })
    .catch(function(err) {
      console.log(err);
      showNotification('No se pudo guardar la publicación');
    });
}

form.addEventListener('submit', function(event) {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    showNotification('Escribe un título y una ubicación');
    return;
  }

  var post = {
    id: new Date().toISOString(),
    title: titleInput.value.trim(),
    location: locationInput.value.trim(),
    image: picture || DEFAULT_IMAGE
  };

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function(sw) {
        return writeData('sync-posts', post)
          .then(function() {
            return sw.sync.register('sync-new-posts');
          })
          .then(function() {
            createCard(post, true);
            showNotification('Tu publicación se guardó para sincronizarse');
          });
      })
      .catch(function(err) {
        // Background Sync no disponible: se quita de la cola y se envía directo
        console.log(err);
        deleteItemFromData('sync-posts', post.id)
          .then(function() {
            sendData(post);
          });
      });
  } else {
    sendData(post);
  }

  form.reset();
});
