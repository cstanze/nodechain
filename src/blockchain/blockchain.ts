import Transaction, { TransactionType } from '../wallet/transaction'
import Wallet from '../wallet/wallet'
import Account from './account'
import Block from './block'
import Stake from './stake'
import Validators from './validators'

export default class Blockchain {
  chain: Block[]
  stakes: Stake
  accounts: Account
  validators: Validators

  constructor() {
    this.chain = [Block.genesis()]
    this.stakes = new Stake()
    this.accounts = new Account()
    this.validators = new Validators()
  }

  createBlock(transactions: Transaction[], wallet: Wallet) {
    const block = Block.createBlock(
      this.chain[this.chain.length-1],
      transactions,
      wallet
    )

    return block
  }

  addBlock(block: Block) {
    this.chain.push(block)
    return block
  }

  static isValidChain(chain: Block[]): boolean {
    if(JSON.stringify(chain[0]) != JSON.stringify(Block.genesis()))
      return false

    for(let i = 1; i < chain.length; i++) {
      const block = chain[i]
      const lastBlock = chain[i-1]
      if((block.previousHash != lastBlock.hash) || (block.hash != Block.blockHash(block)))
        return false
    }

    return true
  }

  isValidBlock(block: Block) {
    const lastBlock = this.chain[this.chain.length-1]

    if(
      block.previousHash == lastBlock.hash &&
      block.hash == Block.blockHash(block) &&
      Block.verifyBlock(block) &&
      Block.verifyLeader(block, this.getLeader())
    ) {
      console.log(`block valid`)
      this.addBlock(block)
      return true
    }
    return false
  }

  executeTransactions(block: Block) {
    block.data.forEach((transaction: Transaction) => {
      switch(transaction.type) {
        case TransactionType.transaction:
          this.accounts.update(transaction)
          break
        case TransactionType.stake:
          this.stakes.update(transaction)
          this.accounts.decrement(
            transaction.input?.from as string,
            transaction.output?.amount as number
          )
          break
        case TransactionType.validator:
          if(this.validators.update(transaction)) {
            this.accounts.decrement(
              transaction.input?.from as string,
              transaction.output?.amount as number,
            )
          }
      }
      this.accounts.transferFee(block, transaction)
    })
  }

  replaceChain(chain: Block[]) {
    if(chain.length <= this.chain.length) {
      console.log(`Recieved chain is not longer than the current chain`)
      return
    } else if(!Blockchain.isValidChain(chain)) {
      console.log(`Recieved chain is invalid`)
      return
    }

    console.log(`Replacing current chain with new chain`)
    this.chain = chain
  }

  getBalance(publicKey: string) {
    return this.accounts.getBalance(publicKey)
  }

  getLeader(): string {
    return this.stakes.getMax(this.validators.list)
  }
}
