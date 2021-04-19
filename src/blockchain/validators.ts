import Transaction from "../wallet/transaction"

export default class Validators {
  list: string[]

  constructor() {
    this.list = []
  }

  update(transaction: Transaction): boolean {
    if(transaction.output?.amount == 30 && transaction.output?.to == "0") {
      this.list.push(transaction.input?.from as string)
      return true
    }

    return false
  }
}
