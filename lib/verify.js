var Opt = require('stdopt')

class VerifyFunction extends Opt {
  static parse (fn) {
    if (typeof fn === 'function') {
      return fn
    }
  }
}

module.exports = VerifyFunction
