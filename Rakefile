SRC_DIR = "src"
LIB_DIR = "lib"
BIN_DIR = "bin"

PEGJS = "#{BIN_DIR}/pegjs"

SRC_FILES = Dir["#{SRC_DIR}/**/*.js"]

PEGJS_SRC_FILE  = "#{SRC_DIR}/peg.js"
PEGJS_OUT_FILE  = "#{LIB_DIR}/peg.js"

PARSER_SRC_FILE  = "#{SRC_DIR}/parser.pegjs"
PARSER_OUT_FILE  = "#{SRC_DIR}/parser.js"

PEGJS_VERSION = File.read("VERSION").strip

def preprocess(input, base_dir, version)
  input.split("\n").map do |line|
    if line =~ /^\s*\/\/\s*@include\s*"([^"]*)"\s*$/
      included_file = "#{base_dir}/#$1"
      if !File.exist?(included_file)
        abort "Included file \"#{included_file}\" does not exist."
      end
      preprocess(File.read(included_file), base_dir, version)
    else
      line
    end
  end.join("\n").gsub("@VERSION", version)
end

file PARSER_OUT_FILE => PARSER_SRC_FILE do
  system "#{PEGJS} --export-var PEG.parser #{PARSER_SRC_FILE} #{PARSER_OUT_FILE}"
end

file PEGJS_OUT_FILE => SRC_FILES do
  File.open(PEGJS_OUT_FILE, "w") do |f|
    f.write(preprocess(File.read(PEGJS_SRC_FILE), SRC_DIR, PEGJS_VERSION))
  end
end

desc "Generate the grammar parser"
task :parser => PARSER_OUT_FILE

desc "Build the peg.js file"
task :build => PEGJS_OUT_FILE

task :default => :build
