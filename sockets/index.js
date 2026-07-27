export default function configurarSockets(io) {
  io.use((socket, next) => {
    const sessao = socket.request.session;

    if (!sessao?.usuario) {
      return next(
        new Error('Usuário não autenticado.')
      );
    }

    socket.usuario = sessao.usuario;

    return next();
  });

  io.on('connection', (socket) => {
    const salaDoUsuario =
      `usuario:${socket.usuario.id}`;

    socket.join(salaDoUsuario);

    console.log(
      `Socket conectado: ${socket.usuario.username}`
    );

    socket.on('disconnect', () => {
      console.log(
        `Socket desconectado: ${socket.usuario.username}`
      );
    });
  });
}