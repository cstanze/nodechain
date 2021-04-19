export const getRemoteSocket = (sock, port = '5001') => {
  return `ws://${sock._socket.remoteAddress.replace('::ffff:', '')}:${port}`
}

export const getRemoteSocketClosed = (sock) => {
  if(sock._isServer || sock._socket._peername)
    return {
      url: `ws://${sock._socket._peername.address.replace('::ffff:')}`,
      hasUrl: false
    }
  else
    return {
      url: sock._url,
      hasUrl: true
    }
}
