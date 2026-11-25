import { useEffect, useRef, useState } from 'react';
import { DEFAULT_IMAGE } from '../config.js';

const MAX_WIDTH = 480;

// Formulario para publicar con cámara, galería y GPS
export default function CreatePost({ onClose, onSubmit, showToast }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [picture, setPicture] = useState(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }

  // Al abrir el formulario se enciende la cámara; al cerrarlo se apaga
  useEffect(() => {
    let cancelled = false;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraReady(true);
        })
        .catch((err) => {
          console.log('No se pudo usar la cámara:', err);
        });
    }

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  function drawToCanvas(source, width, height) {
    const canvas = canvasRef.current;
    const scale = width > MAX_WIDTH ? MAX_WIDTH / width : 1;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  }

  function handleCapture() {
    const video = videoRef.current;
    setPicture(drawToCanvas(video, video.videoWidth, video.videoHeight));
    stopCamera();
  }

  function handleFile(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setPicture(drawToCanvas(img, img.width, img.height));
        stopCamera();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function handleLocation() {
    if (!('geolocation' in navigator)) {
      showToast('Tu dispositivo no tiene GPS disponible');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        setLocation(`Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`);
      },
      () => {
        setLocating(false);
        showToast('No se pudo obtener la ubicación, escríbela manualmente');
      },
      { timeout: 10000 }
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (title.trim() === '' || location.trim() === '') {
      showToast('Escribe un título y una ubicación');
      return;
    }

    onSubmit({
      id: new Date().toISOString(),
      title: title.trim(),
      location: location.trim(),
      image: picture || DEFAULT_IMAGE
    });
    onClose();
  }

  return (
    <div id="create-post">
      <form onSubmit={handleSubmit}>
        <video
          ref={videoRef}
          id="player"
          autoPlay
          playsInline
          muted
          style={{ display: cameraReady ? 'block' : 'none' }}
        />
        <canvas ref={canvasRef} id="canvas" />
        {picture && <img id="image-preview" src={picture} alt="Vista previa de la foto" />}

        {cameraReady && (
          <div>
            <button type="button" id="capture-btn" className="mdl-button mdl-button--raised mdl-button--colored" onClick={handleCapture}>
              <i className="material-icons">photo_camera</i> Tomar foto
            </button>
          </div>
        )}

        {!picture && (
          <div id="pick-image">
            <h6>{cameraReady ? 'También puedes elegir una imagen' : 'Elige una imagen'}</h6>
            <input type="file" accept="image/*" capture="environment" id="image-picker" onChange={handleFile} />
          </div>
        )}

        <div className="input-section">
          <label htmlFor="title">Título</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="input-section">
          <label htmlFor="location">Ubicación</label>
          <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <button type="button" id="location-btn" className="mdl-button mdl-button--colored" onClick={handleLocation} disabled={locating}>
            <i className="material-icons">my_location</i> {locating ? 'Buscando...' : 'Usar mi ubicación'}
          </button>
        </div>

        <div>
          <button type="submit" id="post-btn" className="mdl-button mdl-button--raised mdl-button--colored mdl-color--accent">
            Postear!
          </button>
        </div>
        <div>
          <button type="button" id="close-create-post-modal-btn" className="mdl-button mdl-button--fab" onClick={onClose} aria-label="Cerrar">
            <i className="material-icons">close</i>
          </button>
        </div>
      </form>
    </div>
  );
}
