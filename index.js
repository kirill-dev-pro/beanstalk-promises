const fivebeans = require('fivebeans');

module.exports = class Beanstalk {
  constructor(debug, default_ttl) {
    this.debug = !!debug;
    this.default_ttl = default_ttl || 60; // 1 min
  }

  connect(host, port, reconnect) {
    return new Promise((resolve, reject)=>{
      try {
        let that = this; // Becouse of this is not always this
        that.client = new fivebeans.client(host, port); // default is 127.0.0.1 and 11300
        that.reconnect = reconnect || 1000; // timeout to reconnect, set 0 to disable reconnecting
        that.client.on('connect', function() {
          if (that.debug) console.log('Connected to beanstalk');
          resolve();
        })
        .on('close', function(err){
          if (err)
          that.client.end()
          if (that.debug) console.log('Beanstalk connection closed');
          if (that.reconnect) {
            that.connect(host, port, reconnect).then(()=>{
              if (that.debug) console.log('Reconnected to beanstalk');
              resolve()
            })
          } else {
            if (that.debug) console.log('No reconnection');
          }
        }).connect()
      } catch(err) {
        reject(err)
      }
    })
  }

  quit() {
    return new Promise((resolve, reject)=>{
      try {
        this.reconnect = null;
        this.client.quit();
        resolve();
      } catch (err) {
        reject(err)
      }
    })
  }

  watchTube(tube) {
    return new Promise((resolve,reject)=>{
      this.client.watch(tube, (err, numwatched)=>{
        if (!err)
          resolve(numwatched);
        else
          reject(err)
      })
    })
  }

  useTube(tube) {
    return new Promise((resolve,reject)=>{
      this.client.use(tube, (err, usedTube)=>{
        if (!err)
          resolve(usedTube);
        else
          reject(err)
      })
    })
  }

  deleteJob(job) {
    return new Promise((resolve, reject)=>{
      this.client.destroy(job.id, (err)=>{
        if (!err)
          resolve()
        else
          reject(err)
      })
    })
  }

  releaseJob(job) {
    return new Promise((resolve, reject)=>{
      this.client.release(job.id, 1, 1, (err)=>{
        if (!err)
          resolve()
        else
          reject(err)
      })
    })
  }

  buryJob(job) {
    return new Promise((resolve, reject)=>{
      this.client.bury(job.id, 0, (err)=>{
        if (!err)
          resolve()
        else
          reject(err)
      })
    })
  }

  getJob() {
    return new Promise((resolve, reject)=>{
      this.client.reserve((err, jobid, payload)=>{
        if (!err) {
          let job = {
            id: jobid,
            data: JSON.parse(payload.toString())
          };
          resolve(job)
        } else {
          console.log(err);
          reject(err)
        }
      })
    })
  }

  checkJob() {
    return new Promise((resolve, reject) => {
      this.client.peek_ready((err, jobid, payload)=>{
        if (!err && jobid)
          resolve(true);
        else if (err === 'NOT_FOUND')
          resolve(false);
        else
          reject(err)
      })
    })
  }

  putJob(data) {
    return new Promise((resolve, reject)=>{
      data = JSON.stringify(data);
      this.client.put(0, 0, data._ttl || (this.default_ttl*2), data, function(err, jobid) {
        if (!err) {
          resolve(jobid);
        } else {
          console.log(err);
          reject(err);
        }
      });
    })
  }

  stats() {
    return new Promise((resolve, reject)=>{
      this.client.stats(function(err, res){
        if (!err)
          resolve(res)
        else
          reject(err)
      });
    })
  }

  statsTube(name) {
    return new Promise((resolve, reject)=>{
      this.client.stats_tube(name, function(err, res){
        if (!err)
          resolve(res)
        else
          reject(err)
      });
    })
  }

  listTubes() {
    return new Promise((resolve, reject)=>{
      this.client.list_tubes((err, tubenames)=>{
        if (err)
          reject(err)
        else
          resolve(tubenames)
      })
    })
  }
}