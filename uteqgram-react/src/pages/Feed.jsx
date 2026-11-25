import { useCallback, useEffect, useState } from 'react';
import PostCard from '../components/PostCard.jsx';
import CreatePost from '../components/CreatePost.jsx';
import { fetchPosts, createPost } from '../lib/api.js';
import { readAllData, writeData, deleteItem } from '../lib/db.js';
import { showLocalNotification } from '../lib/notifications.js';

// Las publicaciones más recientes primero
const newestFirst = (list) => [...list].sort((a, b) => String(b.id).localeCompare(String(a.id)));

export default function Feed({ showToast }) {
  const [posts, setPostsRaw] = useState([]);
  const setPosts = useCallback((list) => setPostsRaw(newestFirst(list || [])), []);
  const [pending, setPending] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [source, setSource] = useState('');

  const loadPending = useCallback(() => {
    readAllData('sync-posts')
      .then((data) => setPending(data || []))
      .catch(() => setPending([]));
  }, []);

  // Carga inicial: primero datos locales y después los remotos
  useEffect(() => {
    let networkDataReceived = false;

    readAllData('posts')
      .then((data) => {
        if (!networkDataReceived && data && data.length > 0) {
          console.log('From IndexedDB', data);
          setPosts(data);
          setSource('local');
        }
      })
      .catch((err) => console.log(err));

    fetchPosts()
      .then((data) => {
        networkDataReceived = true;
        console.log('From web', data);
        setPosts(data);
        setSource('remoto');
      })
      .catch((err) => console.log('Sin conexión, se usan datos locales', err));

    loadPending();
  }, [loadPending, setPosts]);

  // Aviso del Service Worker cuando termina la sincronización
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return undefined;
    }

    function handleMessage(event) {
      if (event.data && event.data.action === 'updateUI') {
        fetchPosts()
          .then((data) => {
            setPosts(data);
            setSource('remoto');
            showToast('Publicaciones sincronizadas correctamente');
          })
          .catch((err) => console.log(err));
        loadPending();
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [loadPending, showToast, setPosts]);

  function openModal() {
    setModalOpen(true);

    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choice) => {
        console.log(choice.outcome === 'dismissed' ? 'User cancelled installation' : 'User added to home screen');
      });
      window.deferredPrompt = null;
    }
  }

  async function sendDirect(post) {
    try {
      await createPost(post);
      setPosts(await fetchPosts());
      showToast('Publicación guardada correctamente');
      showLocalNotification('Publicación enviada', `"${post.title}" ya está en UTEQGram`);
    } catch (err) {
      console.log(err);
      showToast('No se pudo guardar la publicación');
    }
  }

  async function handleSubmit(post) {
    const canSync = 'serviceWorker' in navigator && 'SyncManager' in window && navigator.serviceWorker.controller;

    if (!canSync) {
      sendDirect(post);
      return;
    }

    try {
      // Se guarda en IndexedDB y el Service Worker la envía cuando haya conexión
      const registration = await navigator.serviceWorker.ready;
      await writeData('sync-posts', post);
      await registration.sync.register('sync-new-posts');
      setPending((prev) => [post, ...prev.filter((p) => p.id !== post.id)]);
      showToast('Tu publicación se guardó para sincronizarse');
    } catch (err) {
      console.log(err);
      await deleteItem('sync-posts', post.id).catch(() => {});
      sendDirect(post);
    }
  }

  return (
    <>
      <img src="/main-image.jpg" alt="Instalaciones de la UTEQ" className="main-image" />
      <div className="page-content">
        <h5 className="text-center mdl-color-text--primary">Comparte tus Momentos</h5>
        {source && <p className="data-source">Datos: {source === 'local' ? 'guardados en el dispositivo' : 'Supabase (en línea)'}</p>}
        <div id="shared-moments">
          {pending.map((post) => <PostCard key={`p-${post.id}`} post={post} pending />)}
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
          {posts.length === 0 && pending.length === 0 && (
            <p className="text-center empty">Todavía no hay publicaciones.</p>
          )}
        </div>
      </div>

      <div className="floating-button">
        <button type="button" id="share-image-button" className="mdl-button mdl-button--fab mdl-button--colored" onClick={openModal} aria-label="Nueva publicación">
          <i className="material-icons">add</i>
        </button>
      </div>

      {modalOpen && (
        <CreatePost onClose={() => setModalOpen(false)} onSubmit={handleSubmit} showToast={showToast} />
      )}
    </>
  );
}
