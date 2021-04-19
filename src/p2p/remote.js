export const getRemoteSocket = sock => {
  return `ws://${sock._socket.remoteAddress}:5001`
}
