import Transaction from '../wallet/transaction'
import Block from './block'

export default class Account {
  addresses: string[]
  balance: {
    [key: string]: number
  }

  constructor() {
    this.addresses = [
      '579b653a656d209b952d7f85e923643b51bcb6129c6e0ef47c91d6fd95779ce0'
    ]
    this.balance = {
      '579b653a656d209b952d7f85e923643b51bcb6129c6e0ef47c91d6fd95779ce0': 1000
    }
  }

  initialize(address: string) {
    if(this.balance[address] == undefined) {
      this.balance[address] = 0
      this.addresses.push(address)
    }
  }

  transfer(from: string, to: string, amount: number) {
    this.initialize(from)
    this.initialize(to)
    this.increment(to, amount)
    this.decrement(from, amount)
  }
  
  transferFee(block: Block, transaction: Transaction) {
    this.transfer(transaction.input?.from as string, block.validator, transaction.output?.fee as number)
  }

  increment(to: string, amount: number) {
    this.balance[to] += amount
  }

  decrement(from: string, amount: number) {
    this.balance[from] -= amount
  }

  getBalance(address: string) {
    this.initialize(address)
    return this.balance[address]
  }

  update(transaction: Transaction) {
    this.transfer(transaction.input?.from as string, transaction.output?.to as string, transaction.output?.amount as number)
  }
}
