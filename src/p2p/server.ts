import WebSocket from 'ws'
import Block from '../blockchain/block'
import Blockchain from '../blockchain/blockchain'
import TransactionPool from '../wallet/pool'
import Transaction from '../wallet/transaction'
import Wallet from '../wallet/wallet'

const P2P_PORT = process.env.P2P_PORT as unknown as number || 5001
const peers: string[] = process.env.PEERS ? process.env.PEERS.split(',') : []
const MessageType = {
  chain: `CHAIN`,
  transaction: `TRANSACTION`,
  block: `BLOCK`
}

export default class P2PServer {
  blockchain: Blockchain
  sockets: WebSocket[]
  transactionPool: TransactionPool
  wallet: Wallet

  constructor(blockchain: Blockchain, transactionPool: TransactionPool, wallet: Wallet) {
    this.blockchain = blockchain
    this.sockets = []
    this.transactionPool = transactionPool
    this.wallet = wallet
  }

  listen() {
    const server = new WebSocket.Server({ port: P2P_PORT })
    server.on('connection', sock => this.connectSocket(sock))
    this.connectToPeers()
    
    console.log(`Listening for peer connection on port: ${P2P_PORT}`)
  }

  connectSocket(sock: WebSocket) {
    this.sockets.push(sock)
    console.log(`Socket connected: ${sock.url}`)
    this.messageHandler(sock)
    this.closeHandler(sock)
    this.sendChain(sock)
  }

  connectToPeers() {
    peers.forEach(peer => {
      const socket = new WebSocket(peer)
      socket.on('open', () => this.connectSocket(socket))
    })
  }

  closeHandler(sock: WebSocket) {
    sock.on('close', (socket: WebSocket) => {
      this.sockets = this.sockets.filter(sock => socket != sock)
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
      }
    })
  }

  sendChain(sock: WebSocket) {
    sock.send(JSON.stringify({
      type: MessageType.chain,
      chain: this.blockchain.chain
    }))
  }

  syncChain() {
    this.sockets.forEach(sock => {
      this.sendChain(sock)
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
