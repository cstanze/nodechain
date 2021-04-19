export const getRemoteSocket = (sock, port = '5001') => {
  return `ws://${sock._socket.remoteAddress.replace('::ffff:', '')}:${port}`
}

export const getRemoteSocketClosed = (sock) => {
  if(sock._isServer || sock._socket._peername)
    return `ws://${sock._socket._peername.address.replace('::ffff:')}`
  else
    return sock._url
}
