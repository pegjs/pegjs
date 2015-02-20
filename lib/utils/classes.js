/* Class utilities */
var classes = {
  subclass: function(child, parent) {
    function Ctor() {}
    Ctor.prototype = parent.prototype;
    child.prototype = new Ctor();
    child.prototype.constructor = child;
  },
};

module.exports = classes;
