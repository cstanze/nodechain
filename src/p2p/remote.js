export const getRemoteSocket = sock => {
  return `ws://${sock._socket.remoteAddr}:${sock._socket.remotePort}`
}
