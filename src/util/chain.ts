import { SHA256 } from 'crypto-js'
import { eddsa as EDDSA } from 'elliptic'
import { v1 as uuid } from 'uuid'

const eddsa = new EDDSA("ed25519")

export default class ChainUtil {
  static genKeyPair(secret: string): EDDSA.KeyPair {
    return eddsa.keyFromSecret(secret)
  }

  static id(): string {
    return uuid()
  }

  static hash(data: any): string {
    return SHA256(JSON.stringify(data)).toString()
  }

  static verifySignature(publicKey: string, signature: EDDSA.Signature, dataHash: string) {
    return eddsa.keyFromPublic(publicKey).verify(dataHash, signature)
  }
}
