/* Class utilities */
var classes = {
  /*
   * The code needs to be in sync with the code template in the compilation
   * function for "action" nodes.
   */
  subclass: function(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  },
};

module.exports = classes;
