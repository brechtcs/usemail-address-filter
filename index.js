var { Opt, hash, list, nothing, string } = require('stdopt')

var OPTS_ERR = 'Invalid option for `usemail-address-filter`'
var PHASE_ERR = 'Address filter must run in phase `from` or `to`'

module.exports.allow = function (opts) {
  var { addresses, verify } = new Config(opts).catch(OPTS_ERR).value()

  return async function allow (session, { address }) {
    if (checkPhase(session)) {
      throw new Error(PHASE_ERR)
    }

    if (addresses.includes(address)) return
    if (verify && (await verify(address))) return
    sendReject(session.phase, address)
  }
}

module.exports.block = function (opts) {
  var { addresses, verify } = new Config(opts).catch(OPTS_ERR).value()

  return async function block (session, { address }) {
    if (checkPhase(session)) {
      throw new Error(PHASE_ERR)
    }

    if (addresses.includes(address)) sendReject(session.phase, address)
    if (verify && (await verify(address))) sendReject(session.phase, address)
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

function checkPhase (session) {
  return session.phase !== 'from' && session.phase !== 'to'
}

function sendReject (session, address) {
  var msg = `Mail ${session.phase} ${address} was rejected`
  session.fail(new Error(msg), true)

  if (session.phase === 'from') {
    session.end()
  }
}
