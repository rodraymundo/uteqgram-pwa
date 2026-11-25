export default function Help() {
  return (
    <div className="page-content help-content">
      <h5 className="text-center mdl-color-text--primary">Ayuda</h5>
      <div className="mdl-card mdl-shadow--2dp help-card">
        <div className="mdl-card__supporting-text">
          <h6>¿Qué es UTEQGram?</h6>
          <p>Es una aplicación web progresiva para compartir fotos de momentos en la universidad. Se puede instalar en el celular o en la computadora y funciona aunque no haya internet.</p>
          <h6>¿Cómo publico?</h6>
          <p>Presiona el botón <strong>+</strong>, toma una foto con la cámara (o elige una de la galería), escribe un título y una ubicación y presiona <strong>Postear!</strong>.</p>
          <h6>¿Y si no tengo internet?</h6>
          <p>La publicación se guarda en el dispositivo y se envía sola cuando regresa la conexión. Al terminar recibes una notificación.</p>
          <h6>Versión</h6>
          <p>Esta versión está hecha con React y Vite.</p>
        </div>
      </div>
    </div>
  );
}
