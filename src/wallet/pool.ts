import { TransactionThreshold } from "../config"
import Transaction from "./transaction"

export default class TransactionPool {
  transactions: Transaction[]

  constructor() {
    this.transactions = []
  }

  addTransaction(transaction: Transaction) {
    this.transactions.push(transaction)
    if(this.transactions.length >= TransactionThreshold) {
      return true
    }
    return false
  }

  validTransactions() {
    return this.transactions.filter(transaction => {
      if(!Transaction.verifyTransaction(transaction)) {
        console.log(`Invalid signature from ${transaction.input?.from}`)
        return
      }

      return transaction
    })
  }

  transactionExists(transaction: Transaction) {
    let exists = this.transactions.find(t => t.id == transaction.id)
    return exists
  }

  clear() {
    this.transactions = []
  }
}
