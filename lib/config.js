var { Opt, hash, list, nothing, string } = require('stdopt')
var Verify = require('./verify')

class Config extends Opt {
  static parse (opts) {
    return hash(opts, this.struct).map(config => {
      config.addresses = list(config.addresses).or([]).value()
      return config
    })
  }

  static get struct () {
    return {
      addresses: [nothing, list.of(string)],
      verify: [nothing, Verify]
    }
  }
}

module.exports = Config
