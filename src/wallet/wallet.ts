import { eddsa } from 'elliptic'
import ChainUtil from '../util/chain'
import TransactionPool from './pool'
import Blockchain from "../blockchain/blockchain"
import Transaction from './transaction'
import { InitialBalance } from '../config'

export default class Wallet {
  balance: number
  keyPair: eddsa.KeyPair
  publicKey: string

  constructor(secret: string) {
    this.balance = InitialBalance
    this.keyPair = ChainUtil.genKeyPair(secret)
    this.publicKey = this.keyPair.getPublic('hex')
  }


  sign(dataHash: string) {
    return this.keyPair.sign(dataHash)
  }

  createTransaction(to: string, amount: number, type: string, blockchain: Blockchain, transactionPool: TransactionPool) {
    this.balance = this.getBalance(blockchain)
    if(amount > this.balance) {
      console.log(
        `Amount: ${amount} exceeds the current balance: ${this.balance}`
      )
      return
    }

    let transaction = Transaction.newTransaction(this, to, amount, type)
    transactionPool.addTransaction(transaction as Transaction)
    return transaction
  }

  getBalance(blockchain: Blockchain) {
    return blockchain.getBalance(this.publicKey)
  }

  getPublicKey() {
    return this.publicKey
  }

  toString() {
    return `Wallet -
      publicKey: ${this.publicKey.toString()}
      balance: ${this.balance}`
  }
}
