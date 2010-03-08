require "net/http"
require "uri"

version = File.read("VERSION").strip

file "lib/pegjs-runtime-#{version}.min.js" => "lib/runtime.js" do |t|
  response = Net::HTTP.post_form(
    URI.parse("http://closure-compiler.appspot.com/compile"),
    {
      "js_code"           => File.read(t.prerequisites.first),
      "compilation_level" => "SIMPLE_OPTIMIZATIONS",
      "output_format"     => "text",
      "output_info"       => "compiled_code"
    }
  )

  if response.code != "200"
    abort "Error calling Google Closure Compiler API: #{response.message}"
  end

  File.open(t.name, "w") { |f| f.write(response.body) }
end

task :default => "lib/pegjs-runtime-#{version}.min.js"
