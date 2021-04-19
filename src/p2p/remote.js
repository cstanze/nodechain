export const getRemoteSocket = (sock, port = 5001) => {
  return `ws://${sock._socket.remoteAddress.replace('::ffff:', '')}:${port}`
}
