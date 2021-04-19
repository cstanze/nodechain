import express from 'express'
import Blockchain from '../blockchain/blockchain'
import P2PServer from '../p2p/server'
import Wallet from '../wallet/wallet'
import TransactionPool from '../wallet/pool'
import { TransactionThreshold } from '../config'
import Transaction from '../wallet/transaction'

const PORT = 3000
const app = express()

app.use(express.json())

const blockchain = new Blockchain()
const wallet = new Wallet(`first leader wallet`)
const pool = new TransactionPool()
const p2p = new P2PServer(blockchain, pool, wallet)

app.get('/ico/transactions', (req, res) => {
  res.json(pool.transactions)
})

app.get('/ico/blocks', (req, res) => {
  res.json(blockchain.chain)
})

app.post('/ico/transact', (req, res) => {
  const { to, amount, type } = req.body
  const transaction = wallet.createTransaction(
    to,
    amount,
    type,
    blockchain,
    pool
  )
  p2p.broadcastTransaction(transaction as Transaction)
  if(pool.transactions.length >= TransactionThreshold) {
    p2p.broadcastBlock(blockchain.createBlock(pool.transactions, wallet))
  }
  res.redirect('/ico/transactions')
})

app.get('/ico/public-key', (req, res) => {
  res.json({ publicKey: wallet.publicKey })
})

app.get('/ico/balance', (req, res) => {
  res.json({ balance: blockchain.getBalance(wallet.publicKey) })
})

app.post('/ico/balance-of', (req, res) => {
  res.json({ balance: blockchain.getBalance(req.body.publicKey) })
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
p2p.listen()
