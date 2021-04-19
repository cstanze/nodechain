import { eddsa } from 'elliptic'
import ChainUtil from '../util/chain'
import Wallet from './wallet'
import { TransactionFee } from '../config'

export const TransactionType = {
  transaction: `TRANSACTION`,
  stake: `STAKE`,
  validator: `VALIDATOR`
}

export default class Transaction {
  id: string
  type: string | null
  input: {
    timestamp: number,
    from: string,
    signature: eddsa.Signature
  } | null
  output: {
    to: string,
    amount: number,
    fee: number
  } | null

  constructor() {
    this.id = ChainUtil.id()
    this.type = null
    this.input = null
    this.output = null
  }

  static newTransaction(senderWallet: Wallet, to: string, amount: number, type: string) {
    if(amount + TransactionFee > senderWallet.balance) {
      console.log(`Not enough balance`)
      return
    }

    return Transaction.generateTransaction(senderWallet, to, amount, type)
  }

  static generateTransaction(senderWallet: Wallet, to: string, amount: number, type: string) {
    const transaction = new this()
    transaction.type = type
    transaction.output = {
      to,
      amount: amount - TransactionFee,
      fee: TransactionFee
    }

    Transaction.signTransaction(transaction, senderWallet)
    return transaction
  }

  static signTransaction(transaction: Transaction, senderWallet: Wallet) {
    transaction.input = {
      timestamp: Date.now(),
      from: senderWallet.publicKey,
      signature: senderWallet.sign(ChainUtil.hash(transaction.output))
    }
  }

  static verifyTransaction(transaction: Transaction) {
    return ChainUtil.verifySignature(
      transaction.input?.from as string,
      transaction.input?.signature as eddsa.Signature,
      ChainUtil.hash(transaction.output)
    )
  }
}
