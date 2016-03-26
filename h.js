// Returns all child elements of a given element which match a provided selector
h.children = function (el, selector) {
  var selectors = null,
    children = null,
    childSelectors = [],
    tempId = '';

  selectors = selector.split(',');

  if (!el.id) {
    tempId = '_temp_';

    el.id = tempId;
  }

  while (selectors.length) {
    childSelectors.push('#' + el.id + '>' + selectors.pop());
  }

  children = document.querySelectorAll(childSelectors.join(', '));

  if (tempId) {
    el.removeAttribute('id');
  }

  return children;
};


// Returns the closest parent element to a given element matching the provided selector, 
// optionally including the element itself
h.closestParent = function (el, selector, includeSelf) {
  var parent = el.parentNode;

  if (includeSelf && el.matches(selector)) {
    return el;
  }

  while (parent && parent !== document.body) {
    if (parent.matches && parent.matches(selector)) {
      return parent;
    } else if (parent.parentNode) {
      parent = parent.parentNode;
    } else {
      return null;
    }
  }

  return null;
};

// Returns the index of a given element in relation to its siblings, optionally restricting 
// siblings to those matching a provided selector
h.index = function (el, selector) {
  var i = 0;

  while ((el = el.previousElementSibling) !== null) {
    if (!selector || el.matches(selector)) {
      ++i;
    }
  }

  return i;
};

// Basically, A thunk is a function that wraps an expression to delay its evaluation.
// calculation of 1 + 2 is delayed
// foo can be called later to perform the calculation
// foo is a thunk!
// let foo = () => 1 + 2;

// Refer to http://blog.getify.com/thoughts-on-thunks/
// An eager async thunk is basically an early predecessor to promises. 
// To put it another way, a promise is an evolved thunk with a fancier API (and a few other important characteristics, too).
h.makeEagerAsyncThunk = function (fn, ...args) {
  var v = {};
  var fns = [];
  fn(...args, function waitForIt(...args) {
    if (!("args" in v)) v.args = args;
    if (fns.length > 0) {
      while (fns.length > 0) {
        fns.shift()(...v.args);
      }
    }
  });
  return function thunk(cb) {
    if ("args" in v) cb(...v.args);
    else fns.push(cb);
  };
}
