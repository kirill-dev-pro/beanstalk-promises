/* global describe, before, after, it */

const assert = require('assert')
const Beanstalk = require('../index')

describe('Beanstalk', function () {
  let jobSaved
  describe('Connection', function () {
    let client
    it('should create instance of beanstalk-promises', function () {
      client = new Beanstalk()
    })
    it('should connect to beanstalkd on localhost on port 11300', async function () {
      await client.connect()
    })
    it('should quit and close connection', async function () {
      await client.quit()
    })
  })
  describe('Work with tubes', function () {
    let client
    before(async function () {
      client = new Beanstalk()
      await client.connect()
    })
    it('should watch test tube and return number of watched by client tubes', async function () {
      const numwatched = await client.watchTube('test')
      assert.strictEqual(numwatched, 2)
    })
    it('should use test tube and return name of tube being used', async function () {
      const usedTube = await client.useTube('test')
      assert.strictEqual(usedTube, 'test')
    })
    after(async function () {
      client.quit()
    })
  })
  describe('Producing jobs', function () {
    let client
    before(async function () {
      client = new Beanstalk()
      await client.connect()
      await client.useTube('test')
    })
    it('should check if ready job is in tube and respond with false', async function () {
      const check = await client.checkJob()
      assert.strictEqual(check, false)
    })
    it('should put job and respond with job id', async function () {
      const sampleJob = { key: 'value' }
      const jobid = await client.putJob(sampleJob)
      jobSaved = jobid
      assert.strictEqual(typeof jobid, 'number')
    })
    it('should check if job is in tube with status ready and respond with true', async function () {
      const check = await client.checkJob()
      assert.strictEqual(check, true)
    })
    after(async function () {
      client.quit()
    })
  })
  describe('Consuming jobs', function () {
    let client
    let job
    before(async function () {
      client = new Beanstalk()
      await client.connect()
      await client.watchTube('test')
    })
    it('should get job from tube', async function () {
      job = await client.getJob()
      assert.strictEqual(job.id, jobSaved)
      assert.strictEqual(job.data.key, 'value')
    })
    it('should delete job by id', async function () {
      await client.deleteJob(job)
    })
    after(async function () {
      client.quit()
    })
  })
})
