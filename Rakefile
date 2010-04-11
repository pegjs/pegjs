require "net/http"
require "uri"

desc "Build the minified parser runtime"
task :minify do
  response = Net::HTTP.post_form(
    URI.parse("http://closure-compiler.appspot.com/compile"),
    {
      "js_code"           => File.read("lib/runtime.js"),
      "compilation_level" => "SIMPLE_OPTIMIZATIONS",
      "output_format"     => "text",
      "output_info"       => "compiled_code"
    }
  )

  if response.code != "200"
    abort "Error calling Google Closure Compiler API: #{response.message}"
  end

  version = File.read("VERSION").strip
  File.open("lib/pegjs-runtime-#{version}.min.js", "w") { |f| f.write(response.body) }
end

desc "Generate the grammar parser"
task :metaparser do
  system "bin/pegjs --start-rule grammar PEG.grammarParser lib/metagrammar.pegjs"
end
