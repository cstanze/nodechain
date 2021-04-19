import Transaction from "../wallet/transaction"

export default class Stake {
  addresses: string[]
  balance: {
    [key: string]: number
  }

  constructor() {
    this.addresses = [
      '579b653a656d209b952d7f85e923643b51bcb6129c6e0ef47c91d6fd95779ce0'
    ]
    this.balance = {
      '579b653a656d209b952d7f85e923643b51bcb6129c6e0ef47c91d6fd95779ce0': 0
    }
  }

  initialize(address: string) {
    if(this.balance[address] == undefined) {
      this.balance[address] = 0
      this.addresses.push(address)
    }
  }

  addStake(from: string, amount: number) {
    this.initialize(from)
    this.balance[from] += amount
  }

  getStake(address: string) {
    this.initialize(address)
    return this.balance[address]
  }

  getMax(addresses: string[]): string {
    let balance = -1
    let leader: string | undefined = undefined
    addresses.forEach((address: string) => {
      if(this.getStake(address) > balance) {
        leader = address
      }
    })
    return leader as unknown as string
  }

  update(transaction: Transaction) {
    this.addStake(transaction.input?.from as string, transaction.output?.amount as number)
  }
}
