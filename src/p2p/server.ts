import WebSocket from 'ws'
import Block from '../blockchain/block'
import Blockchain from '../blockchain/blockchain'
import TransactionPool from '../wallet/pool'
import Transaction from '../wallet/transaction'
import Wallet from '../wallet/wallet'

const PEERS: string[] = process.env.PEERS ? process.env.PEERS.split(',') : []
const P2P_PORT = process.env.P2P_PORT as unknown as number || 5001
const MessageType = {
  chain: `CHAIN`,
  transaction: `TRANSACTION`,
  block: `BLOCK`,
  peerSync: `PEER_SYNC`
}

interface Peer {
  socket: string,
  connected: boolean
}

export default class P2PServer {
  blockchain: Blockchain
  sockets: WebSocket[]
  peers: Peer[]
  transactionPool: TransactionPool
  wallet: Wallet
  server: WebSocket.Server | null

  constructor(blockchain: Blockchain, transactionPool: TransactionPool, wallet: Wallet) {
    this.blockchain = blockchain
    this.sockets = []
    this.peers = [...PEERS.map(peer => ({ socket: peer, connected: false }))]
    this.transactionPool = transactionPool
    this.wallet = wallet
    this.server = null
  }

  listen() {
    this.server = new WebSocket.Server({ port: P2P_PORT })
    this.server.on('connection', sock => this.connectSocket(sock))
    this.connectToPeers()
    
    console.log(`Listening for peer connection on port: ${P2P_PORT}`)
  }

  connectSocket(sock: WebSocket) {
    this.sockets.push(sock)
    console.log(`Socket connected: ${sock.url}`)
    this.messageHandler(sock)
    this.closeHandler(sock)
    this.sendChain(sock)
    this.syncPeers()
  }

  connectToPeers() {
    this.peers.forEach(peer => {
      if(!peer.connected) {
        const socket = new WebSocket(peer.socket)
        socket.on('open', () => {
          this.peers[this.peers.indexOf(this.peers.find(pr => pr.socket == socket.url) as unknown as Peer)].connected = true
          this.connectSocket(socket)
        })
      }
    })
  }

  closeHandler(sock: WebSocket) {
    sock.on('close', (socket: WebSocket) => {
      this.sockets = this.sockets.filter(sock => socket != sock)

      this.peers = this.peers.filter(peer => peer.socket != socket.url)
      this.syncPeers()
    })
  }

  messageHandler(sock: WebSocket) {
    sock.on('message', (msg: string) => {
      const data = JSON.parse(msg)
      console.log(`Recieved data from peer: `, data)

      switch(data.type) {
        case MessageType.chain:
          this.blockchain.replaceChain(data.chain)
          break
        case MessageType.transaction:
          if(!this.transactionPool.transactionExists(data.transaction)) {
            const reachedThreshold = this.transactionPool.addTransaction(data.transaction)
            this.broadcastTransaction(data.transaction)

            if(reachedThreshold) {
              if(this.blockchain.getLeader() == this.wallet.getPublicKey()) {
                console.log(`Creating block (stake leader)`)
                const block = this.blockchain.createBlock(
                  this.transactionPool.transactions,
                  this.wallet
                )
                this.broadcastBlock(block)
              }
            }
          }
          break
        case MessageType.block:
          if(this.blockchain.isValidBlock(data.block)) {
            this.broadcastBlock(data.block)
          }
          break
        case MessageType.peerSync:
          this.peers = [...data.peers, sock.url].filter(peer => peer != undefined).map(url => ({ socket: url, connected: this.peers.map(peer => peer.socket).includes(url) }))
          if(!sock.url)
            this.peers.push(
              {
                socket: Array.from(this.server?.clients as Set<WebSocket>).find(client => client == sock)?.url as string,
                connected: true
              }
            )
          console.log(`Recieved peer list from synced peer (${sock.url || 'server client'}), replacing peer list`, this.peers)
          break
      }
    })
  }

  

  syncChain() {
    this.sockets.forEach(sock => {
      this.sendChain(sock)
    })
  }

  syncPeers() {
    this.sockets.forEach(sock => {
      this.sendPeers(sock)
    })
  }

  broadcastTransaction(transaction: Transaction) {
    this.sockets.forEach(socket => {
      this.sendTransaction(socket, transaction)
    })
  }

  broadcastBlock(block: Block) {
    this.sockets.forEach(socket => {
      this.sendBlock(socket, block)
    })
  }

  sendPeers(sock: WebSocket) {
    sock.send(JSON.stringify({
      type: MessageType.peerSync,
      peers: [...new Set(this.peers.map(peer => peer.socket).filter(peer => peer != sock.url))]
    }))
  }
  
  sendChain(sock: WebSocket) {
    sock.send(JSON.stringify({
      type: MessageType.chain,
      chain: this.blockchain.chain
    }))
  }

  sendBlock(socket: WebSocket, block: Block) {
    socket.send(JSON.stringify({
      type: MessageType.block,
      block
    }))
  }

  sendTransaction(socket: WebSocket, transaction: Transaction) {
    socket.send(JSON.stringify({
      type: MessageType.transaction,
      transaction
    }))
  }
}
