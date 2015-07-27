function curry(fn) {
  var arity = fn.length;
  return (function resolver() {
    var memory = Array.prototype.slice.call(arguments);
    return function () {
      var local = memory.slice(),
        next;
      Array.prototype.push.apply(local, arguments);
      next = local.length >= arity ? fn : resolver;
      return next.apply(null, local);
    };
  }());
}
