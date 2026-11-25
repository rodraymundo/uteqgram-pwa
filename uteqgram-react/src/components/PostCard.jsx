import { DEFAULT_IMAGE } from '../config.js';

// Tarjeta de publicación (vista generada del lado del cliente)
export default function PostCard({ post, pending = false }) {
  return (
    <div className={`shared-moment-card mdl-card mdl-shadow--2dp ${pending ? 'pending-card' : ''}`}>
      <div
        className="mdl-card__title"
        style={{ backgroundImage: `url("${post.image || DEFAULT_IMAGE}")` }}
      >
        <h2 className="mdl-card__title-text">{post.title}</h2>
      </div>
      <div className="mdl-card__supporting-text">
        {post.location}
        {pending && ' (pendiente de sincronizar)'}
      </div>
    </div>
  );
}
