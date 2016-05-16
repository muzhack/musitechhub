'use strict'
let logger = require('js-logger-aknudsen').get('db')
let Boom = require('boom')
let R = require('ramda')
let r = require('rethinkdb')

let {getEnvParam,} = require('./environment')

let closeConn = (conn) => {
  conn.close()
  logger.debug('Closed RethinkDB connection')
}

let connectToDb = (host, callback, attempt) => {
  if (attempt == null) {
    attempt = 1
  }
  logger.debug(`Trying to connect to RethinkDB host '${host}', attempt #${attempt}`)
  return r.connect({
    host,
    authKey: getEnvParam('RETHINKDB_AUTH_KEY', null),
    db: 'muzhack',
  }).then((conn) => {
    let invokeCallback = () => {
      logger.debug(`Invoking callback`)
      return callback(conn)
        .then((result) => {
          closeConn(conn)
          return result
        }, (error) => {
          closeConn(conn)
          logger.warn(`There was an error in the callback of withDb: '${error.message}'`,
            error.stack)
          throw new Error(`There was an error in the callback of withDb: ${error.message}`)
        })
    }

    logger.debug(`Successfully connected to RethinkDB host '${host}', attempt #${attempt}`)
    try {
      return r.dbList().run(conn)
        .then((existingDbs) => {
          if (!R.contains('muzhack', existingDbs)) {
            logger.info(`Creating database muzhack`)
            return r.dbCreate('muzhack').run(conn)
          } else {
            logger.debug(`The muzhack database already exists`)
          }
        })
        .then(() => {
          return r.tableList().run(conn)
            .then((existingTables) => {
              return Promise.all(R.reject((x) => {return x == null}, R.map((tableName) => {
                if (!R.contains(tableName, existingTables)) {
                  logger.info(`Creating ${tableName} table`)
                  return r.tableCreate(tableName).run(conn)
                } else {
                  logger.debug(`The ${tableName} table already exists`)
                  return null
                }
              }, ['projects', 'users',])))
            })
        })
        .then(invokeCallback)
    } catch (error) {
      closeConn(conn)
      logger.error(`There was an unhandled exception in the callback of withDb: '${error}'`,
        error.stack)
      throw new Error(`There was an unhandled exception in the callback of withDb`)
    }
  }, (error) => {
    if (attempt < 5) {
      let timeout = attempt * 0.5
      logger.debug(`Waiting ${timeout} second(s) before attempting again to connect to DB...`)
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          connectToDb(host, callback, attempt + 1)
            .then(resolve, reject)
        }, timeout)
      })
    } else {
      logger.warn(`Failed to connect to RethinkDB after ${attempt} attempts: '${error}':`,
        error.stack)
      throw new Error(`Failed to connect to RethinkDB after ${attempt} attempts: '${error}'`)
    }
  })
}

module.exports = {
  withDb: (reply, callback) => {
    let host = getEnvParam('RETHINKDB_HOST', 'localhost')
    return connectToDb(host, callback)
      .then((result) => {
        logger.debug(`Replying with result:`, result)
        reply(result)
      }, (error) => {
        logger.error(`An error was caught: '${error.message}'`, error)
        reply(Boom.badImplementation())
      })
  },
  setUp: () => {
    let host = getEnvParam('RETHINKDB_HOST', 'localhost')
    logger.debug(`Setting up database...`)
    let indexes = ['owner',]
    return connectToDb(host, (conn) => {
      return r.table('projects').indexList()
        .run(conn)
        .then((existingIndexes) => {
          let indexPromises = R.map((index) => {
            logger.debug(`Creating index '${index}'...`)
            return r.table('projects')
              .indexCreate(index)
              .run(conn)
          }, R.difference(indexes, existingIndexes))
          return Promise.all(indexPromises)
            .then(() => {
              return r.table('projects')
                .indexWait()
                .run(conn)
            })
      })
    })
  },
}
