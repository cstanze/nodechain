const PORT = process.env.PORT || 3001

import Blockchain from './blockchain/blockchain'
import express from 'express'
import P2PServer from './p2p/server'
import Wallet from './wallet/wallet'
import TransactionPool from './wallet/pool'
import Transaction from './wallet/transaction'

const blockchain = new Blockchain()
const wallet = new Wallet(Date.now().toString())
const transactionPool = new TransactionPool()
const app = express()
const p2p = new P2PServer(blockchain, transactionPool, wallet)

app.use(express.json())

app.get('/blocks', (req, res) => {
  res.json(blockchain.chain)
})

app.get('/transactions', (req, res) => {
  res.json(transactionPool.transactions)
})

app.post('/transact', (req, res) => {
  const { to, amount, type } = req.body

  const transaction = wallet.createTransaction(
    to, amount, type, blockchain, transactionPool
  )

  p2p.broadcastTransaction(transaction as Transaction)
  res.redirect('/transactions')
})

app.post('/mine', (req, res) => {
  const block = blockchain.addBlock(req.body.data)
  console.log(`New block added: ${block.toString()}`)

  res.redirect('/blocks')
  p2p.syncChain()
})

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})

p2p.listen()

