# beanstalk-promises [![Code Climate](https://codeclimate.com/github/Zmeu213/beanstalk-promises/badges/gpa.svg)](https://codeclimate.com/github/Zmeu213/beanstalk-promises) [![Test Coverage](https://codeclimate.com/github/Zmeu213/beanstalk-promises/badges/coverage.svg)](https://codeclimate.com/github/Zmeu213/beanstalk-promises/coverage) [![Issue Count](https://codeclimate.com/github/Zmeu213/beanstalk-promises/badges/issue_count.svg)](https://codeclimate.com/github/Zmeu213/beanstalk-promises)
Promise wraper for fivebeans client so you can use promises instead of callbacks and await them

### Quick start
```javascript
const Beanstalk = require('beanstalk-promises');

async function main () {
	let client = new Beanstalk();
	await client.connect('127.0.0.1', 11300, 1000);
	await client.watchTube('test');
	let job = await client.getJob();
	await client.quit();
}

main()
```

### Functions

- `constructor(debug, default_ttl)`
Create new instance of beanstalk-promises client. 
  - If `debug` is true (or if it just exist) it will print debug messages.
  - `default_ttl` is a parameter that sets how long job could be reserved.

- `.connect(host, port, reconnect)`
  - `reconnect` is a number in miliseconds, client will reconnect to beanstalk after it if something happens. Set `0` to disable.

- `.quit()`
Disconnects the client, no reconnect.

- `.watchTube(tube)` return number of watched tubes
  - `tube` name of tube to watch 
  
- `.useTube(tube)` return number of used tubes
  - `tube` name of tube to use
  
- `.getJob()` return a `job`. Get available for reserve job from *tubes* watched by client.

- `job` is object
```javascript
{
  id: jobid,    // Job id 
  data: payload // Job data
}
```
- `.buryJob(job)` takes whole `job` object (or just something that have .id property) and bury it

- `.releaseJob(job)` releases a `job`

- `.checkJob()` return `true` if there is avalable for release job in tubes *used* by client. Return false if not. 
Dont reserve jobs, just check. 

- `.putJob(data)` put job to a tube *used* by a client
  - `data` payload for future job.

- `.statsTube(name)` Return stats of tube
  - `name` name of tube

- `.listTubes()` List tubes. Yes.

### License
*MIT*
