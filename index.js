var { Opt, list, nothing, string } = require('stdopt')
var PHASE_ERR = 'Address filter must run in phase `from` or `to`'

module.exports.allow = function (opts) {
  var config = new Config(opts).value()

  return async function block ({ address }, session, ctx) {
    if (checkPhase(ctx)) {
      throw new Error(PHASE_ERR)
    }

    if (config.addr.includes(address)) return
    if (config.verify && (await config.verify(address))) return
    throw new Error(sendReject(phase, address))
  }
}

module.exports.block = function (opts) {
  var config = new Config(opts).value()

  return async function block ({ address }, session, ctx) {
    if (checkPhase(ctx)) {
      throw new Error(PHASE_ERR)
    }

    if (config.addr.includes(address)) throw new Error(sendReject(phase, address))
    if (config.verify && (await config.verify(address))) {
      throw new Error(sendReject(phase, address))
    }
  }
}

class Config extends Opt {
  static parse (opts) {
    try {
      var addr = list(opts.addresses, string).or([]).value()
      var verify = new Method(opts.verify).value()
      return { addr, verify }
    } catch (err) {
      return err
    }
  }
}

class Method extends Opt {
  static parse (fn) {
    if (typeof fn === 'function') {
      return fn
    } else if (fn === false || nothing(fn).isValid) {
      return false
    }
  }
}

function checkPhase (ctx) {
  return !ctx || (ctx.phase !== 'from' && ctx.phase !== 'to')
}

function sendReject (phase, address) {
  return `Mail ${phase} ${address} was rejected`
}
