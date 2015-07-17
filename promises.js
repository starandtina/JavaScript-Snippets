// Promise.all is good for executing many promises at once
Promise.all([
  promise1,
  promise2
]);

// Promise.resolve is good for wrapping synchronous code
Promise.resolve().then(function () {
  if (somethingIsNotRight()) {
    throw new Error("I will be rejected asynchronously!");
  } else {
    return "This string will be resolved asynchronously!";
  }
});

// execute some promises one after the other.
// this takes an array of promise factories, i.e.
// an array of functions that RETURN a promise
// (not an array of promises themselves; those would execute immediately)
function sequentialize(promiseFactories) {
  var chain = Promise.resolve();
  promiseFactories.forEach(function (promiseFactory) {
    chain = chain.then(promiseFactory);
  });
  return chain;
}

// Promise.race is good for setting a timeout:
Promise.race([
  new Promise(function (resolve, reject) {
    setTimeout(reject, 10000); // timeout after 10 secs
  }),
  doSomethingThatMayTakeAwhile();
]);

// Promise finally util similar to Q.finally
// e.g. promise.then(...).catch().then(...).finally(...)
function finally(promise, cb) {
  return promise.then(function (res) {
    var promise2 = cb();
    if (typeof promise2.then === 'function') {
      return promise2.then(function () {
        return res;
      });
    }
    return res;
  }, function (reason) {
    var promise2 = cb();
    if (typeof promise2.then === 'function') {
      return promise2.then(function () {
        throw reason;
      });
    }
    throw reason;
  });
};
