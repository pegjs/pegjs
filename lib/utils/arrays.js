"use strict";

/* Array utilities. */
var arrays = {
  range: function(start, stop) {
    var length = stop - start,
        result = new Array(length),
        i, j;

    for (i = 0, j = start; i < length; i++, j++) {
      result[i] = j;
    }

    return result;
  },

  find: function(array, valueOrPredicate) {
    var length = array.length, i;

    if (typeof valueOrPredicate === "function") {
      for (i = 0; i < length; i++) {
        if (valueOrPredicate(array[i])) {
          return array[i];
        }
      }
    } else {
      for (i = 0; i < length; i++) {
        if (array[i] === valueOrPredicate) {
          return array[i];
        }
      }
    }
  },

  indexOf: function(array, valueOrPredicate) {
    var length = array.length, i;

    if (typeof valueOrPredicate === "function") {
      for (i = 0; i < length; i++) {
        if (valueOrPredicate(array[i])) {
          return i;
        }
      }
    } else {
      for (i = 0; i < length; i++) {
        if (array[i] === valueOrPredicate) {
          return i;
        }
      }
    }

    return -1;
  },

  contains: function(array, valueOrPredicate) {
    return arrays.indexOf(array, valueOrPredicate) !== -1;
  },

  pluck: function(array, key) {
    return array.map(function (e) { return e[key]; });
  },

  some: function(array, predicate) {
    var length = array.length, i;

    for (i = 0; i < length; i++) {
      if (predicate(array[i])) {
        return true;
      }
    }

    return false;
  }
};

module.exports = arrays;
