import { eddsa } from "elliptic"
import ChainUtil from "../util/chain"
import Wallet from "../wallet/wallet"

export default class Block {
   timestamp: number
   previousHash: string
   hash: string
   data: any
   validator: string
   signature: eddsa.Signature | string

  constructor(stamp: number, previousHash: string, hash: string, data: any, validator: string, signature: eddsa.Signature | string) {
    this.timestamp = stamp
    this.previousHash = previousHash
    this.hash = hash
    this.data = data
    this.validator = validator
    this.signature = signature
  }

  static genesis(): Block {
    return new this(0, ``, `0`, [], 'genesis', 'genesis')
  }

  static hash(timestamp: number, previousHash: string, data: any): string {
    return ChainUtil.hash(`${timestamp}${previousHash}${data}`)
  }

  // static createBlock(lastBlock: Block, data: any): Block {
  //   const stamp = Date.now()
  //   const previousHash = lastBlock.hash
  //   const hash = Block.hash(stamp, previousHash, data)

  //   return new this(stamp, previousHash, hash, data)
  // }

  static createBlock(lastBlock: Block, data: any, wallet: Wallet): Block {
    const stamp = Date.now()
    const previousHash = lastBlock.hash
    const hash = Block.hash(stamp, previousHash, data)

    const validator = wallet.getPublicKey()
    const signature = Block.signBlockHash(hash, wallet)
    return new this(stamp, previousHash, hash, data, validator, signature)
  }

  static signBlockHash(hash: string, wallet: Wallet): eddsa.Signature {
    return wallet.sign(hash)
  }

  static verifyBlock(block: Block) {
    return ChainUtil.verifySignature(
      block.validator,
      block.signature as eddsa.Signature,
      Block.hash(block.timestamp, block.previousHash, block.data)
    )
  }

  static verifyLeader(block: Block, leader: string) {
    return block.validator == leader
  }

  static blockHash(block: Block): string {
    const { timestamp, previousHash, data } = block
    return Block.hash(timestamp, previousHash, data)
  }

  toString(): string {
    return `Block -
      Timestamp: ${this.timestamp}
      Previous Hash: ${this.previousHash}
      Hash: ${this.hash}
      Data: ${this.data}
      Validator: ${this.validator}
      Signature: ${this.signature}`
  }
}
