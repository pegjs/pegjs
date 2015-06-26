  // tracer.js
  function peg$DefaultTracer() {
    this.indentLevel = 0;
  }

  peg$DefaultTracer.prototype.trace = function(event) {
    var that = this;

    function log(event) {
      function repeat(string, n) {
         var result = "", i;

         for (i = 0; i < n; i++) {
           result += string;
         }

         return result;
      }

      function pad(string, length) {
        return string + repeat(" ", length - string.length);
      }

      console.log(
          pad(
            event.location.start.line + ":" + event.location.start.column + "-"
              + event.location.end.line + ":" + event.location.end.column + " ",
            20
          )
          + pad(event.type, 10) + " "
          + repeat("  ", that.indentLevel) + event.rule
      );
    }

    switch (event.type) {
      case "rule.enter":
        log(event);
        this.indentLevel++;
        break;

      case "rule.match":
        this.indentLevel--;
        log(event);
        break;

      case "rule.fail":
        this.indentLevel--;
        log(event);
        break;

      default:
        throw new Error("Invalid event type: " + event.type + ".");
    }
  };

  exports.DefaultTracer = peg$DefaultTracer;
