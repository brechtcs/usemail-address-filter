var { sendMail } = require('usemail-test-utils')
var filter = require('./')
var test = require('tape')
var usemail = require('usemail')

test('allow from', async function (t) {
  var count = 0
  var server = usemail({ authOptional: true })
  var config = {
    addresses: ['sync@localhost'],
    verify: async function (addr) {
      return addr === 'async@localhost'
    }
  }

  server.from(filter.allow(config))
  server.use(function (session, ctx) {
    t.notEqual(session.envelope.mailFrom.address, 'nope@localhost')
    count++
  })

  await server.listen()
  await sendMail(server.port, { from: 'sync@localhost' })
  await sendMail(server.port, { from: 'async@localhost' })
  await sendMail(server.port, { from: 'nope@localhost' }).catch(err => t.ok(err))
  await server.close()

  t.equal(count, 2)
  t.end()
})

test('block to', async function (t) {
  var count = 0
  var server = usemail({ authOptional: true })
  var config = {
    addresses: ['sync@localhost'],
    verify: async function (addr) {
      return addr === 'async@localhost'
    }
  }

  server.to(filter.block(config))
  server.use(function (session) {
    t.equal(session.envelope.rcptTo.length, 1)
    t.equal(session.envelope.rcptTo[0].address, 'yep@localhost')
    count++
  })

  await server.listen()
  await sendMail(server.port, {
    to: ['sync@localhost', 'async@localhost', 'yep@localhost']
  })

  await server.close()
  t.equal(count, 1)
  t.end()
})
