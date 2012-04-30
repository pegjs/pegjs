(function() {

module("PEG.compiler");

function testWithVaryingTrackLineAndColumn(name, callback) {
  test(
    name + " (with trackLineAndColumn: false) ",
    function() { callback({ trackLineAndColumn: false }); }
  );
  test(
    name + " (with trackLineAndColumn: true) ",
    function() { callback({ trackLineAndColumn: true }); }
  );
}

})();
