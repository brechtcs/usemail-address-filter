var { Opt, hash, list, nothing, string } = require('stdopt')

var OPTS_ERR = 'Invalid option for `usemail-address-filter`'
var PHASE_ERR = 'Address filter must run in phase `from` or `to`'

module.exports.allow = function (opts) {
  var { addresses, verify } = new Config(opts).catch(OPTS_ERR).value()

  return async function block ({ address }, session, ctx) {
    if (checkPhase(ctx)) {
      throw new Error(PHASE_ERR)
    }

    if (addresses.includes(address)) return
    if (verify && (await verify(address))) return
    throw new Error(sendReject(ctx.phase, address))
  }
}

module.exports.block = function (opts) {
  var { addresses, verify } = new Config(opts).catch(OPTS_ERR).value()

  return async function block ({ address }, session, ctx) {
    if (checkPhase(ctx)) {
      throw new Error(PHASE_ERR)
    }

    if (addresses.includes(address)) throw new Error(sendReject(ctx.phase, address))
    if (verify && (await verify(address))) {
      throw new Error(sendReject(ctx.phase, address))
    }
  }
}

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
      verify: [nothing, VerifyFunction]
    }
  }
}

class VerifyFunction extends Opt {
  static parse (fn) {
    if (typeof fn === 'function') {
      return fn
    }
  }
}

function checkPhase (ctx) {
  return !ctx || (ctx.phase !== 'from' && ctx.phase !== 'to')
}

function sendReject (phase, address) {
  return `Mail ${phase} ${address} was rejected`
}
