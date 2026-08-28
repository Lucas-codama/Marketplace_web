export default function configurarSockets(io) {
  io.on('connection', (socket) => {
    const usuario = socket.request.session?.usuario;
    if (usuario?.id) {
      socket.join(`usuario:${usuario.id}`);
      if (usuario.papel === 'vendedor') socket.join(`vendedor:${usuario.id}`);
      if (usuario.papel === 'admin') socket.join('administradores');
    }
    socket.on('acompanhar_produto', (valor) => {
      const produtoId = Number(valor);
      if (Number.isInteger(produtoId) && produtoId > 0) socket.join(`produto:${produtoId}`);
    });
  });
}
