const fivebeans = require('fivebeans')
const debug = require('debug')('beanstalk')

const DEFAULT_TTL = 60 // 1 min

module.exports = class Beanstalk {
  constructor (debug = false, ttl) {
    this.debug = !!debug // debug log is disabled by default
    this.defaultTTL = ttl || DEFAULT_TTL
  }

  connect (host, port, reconnect) {
    return new Promise((resolve, reject) => {
      try {
        const that = this // Becouse of this is not always this
        that.client = new fivebeans.client(host, port) // eslint-disable-line new-cap
        // default is 127.0.0.1 and 11300
        that.reconnect = reconnect || 1000 // timeout to reconnect, set 0 to disable reconnecting
        that.client.on('connect', function () {
          if (that.debug) debug('Connected to beanstalk')
          resolve()
        })
          .on('close', function (err) {
            if (err) that.client.end()
            if (that.debug) debug('Beanstalk connection closed')
            if (that.reconnect) {
              that.connect(host, port, reconnect).then(() => {
                if (that.debug) debug('Reconnected to beanstalk')
                resolve()
              })
            } else {
              if (that.debug) debug('No reconnection')
            }
          }).connect()
      } catch (err) {
        reject(err)
      }
    })
  }

  quit () {
    return new Promise((resolve, reject) => {
      try {
        this.reconnect = null
        this.client.quit()
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  watchTube (tube) {
    return new Promise((resolve, reject) =>
      this.client.watch(tube, (err, numwatched) =>
        !err ? resolve(parseInt(numwatched, 10)) : reject(err)))
  }

  useTube (tube) {
    return new Promise((resolve, reject) =>
      this.client.use(tube, (err, usedTube) =>
        !err ? resolve(usedTube) : reject(err)))
  }

  deleteJob (job) {
    return new Promise((resolve, reject) =>
      this.client.destroy(job.id, err =>
        !err ? resolve() : reject(err)))
  }

  releaseJob (job) {
    return new Promise((resolve, reject) =>
      this.client.release(job.id, 1, 1, err =>
        !err ? resolve() : reject(err)))
  }

  buryJob (job) {
    return new Promise((resolve, reject) =>
      this.client.bury(job.id, 0, (err) =>
        !err ? resolve() : reject(err)))
  }

  getJob () {
    return new Promise((resolve, reject) =>
      this.client.reserve((err, jobid, payload) => {
        if (!err) {
          try {
            const job = {
              id: parseInt(jobid, 10),
              data: JSON.parse(payload.toString())
            }
            resolve(job)
          } catch (error) {
            reject(error)
          }
        } else {
          debug(err)
          reject(err)
        }
      })
    )
  }

  checkJob () {
    return new Promise((resolve, reject) =>
      this.client.peek_ready((err, jobid, payload) => {
        if (!err && jobid) {
          resolve(true)
        } else if (err === 'NOT_FOUND') {
          resolve(false)
        } else {
          reject(err)
        }
      })
    )
  }

  putJob (data, priority = 0, delay = 0) {
    return new Promise((resolve, reject) => {
      data = JSON.stringify(data)
      this.client.put(priority, delay, data._ttl || (this.defaultTTL * 2), data, function (err, jobid) {
        if (!err) {
          resolve(parseInt(jobid, 10))
        } else {
          debug(err)
          reject(err)
        }
      })
    })
  }

  stats () {
    return new Promise((resolve, reject) =>
      this.client.stats((err, res) =>
        !err ? resolve(res) : reject(err)))
  }

  statsTube (name) {
    return new Promise((resolve, reject) =>
      this.client.stats_tube(name, (err, res) =>
        !err ? resolve(res) : reject(err)))
  }

  listTubes () {
    return new Promise((resolve, reject) =>
      this.client.list_tubes((err, tubenames) =>
        !err ? resolve(tubenames) : reject(err)))
  }
}
