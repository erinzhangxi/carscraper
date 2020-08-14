/*
  NOTES: 
  worker_threads became available in Node.js 10.5.0
  Prioir to Node.js 11.7.0, you could not access the module unless you started node with the --experimental-worker flag.
*/

const { Worker, isMainThread, parentPort } = require('worker_threads');
if (isMainThread) {
  // Create the worker.
  const worker = new Worker('./crawler.js');
  // Listen for messages from the worker and print them.
  worker.on('error', (err) => { throw err })
  worker.on('message', (msg) => { console.log(msg); });
} else {
  // Send a message to the main thread.
  // parentPort.postMessage('-- worker thread --');
}