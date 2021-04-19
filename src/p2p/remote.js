export const getRemoteSocket = (sock, port = '5001') => {
  return `ws://${sock._socket.remoteAddress.replace('::ffff:', '')}:${port}`
}

export const getRemoteSocketClosed = (sock) => {
  return `ws://${sock._peername.address}`
}
