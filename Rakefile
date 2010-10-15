SRC_DIR = "src"
LIB_DIR = "lib"
BIN_DIR = "bin"

PEGJS = "#{BIN_DIR}/pegjs"

SRC_FILES = Dir["#{SRC_DIR}/**/*.js"]

PEGJS_SRC_FILE  = "#{SRC_DIR}/peg.js"
PEGJS_OUT_FILE  = "#{LIB_DIR}/peg.js"

PARSER_SRC_FILE  = "#{SRC_DIR}/parser.pegjs"
PARSER_OUT_FILE  = "#{SRC_DIR}/parser.js"

def preprocess(input, base_dir)
  input.split("\n").map do |line|
    if line =~ /^\s*\/\/\s*@include\s*"([^"]*)"\s*$/
      included_file = "#{base_dir}/#$1"
      if !File.exist?(included_file)
        abort "Included file \"#{included_file}\" does not exist."
      end
      preprocess(File.read(included_file), base_dir)
    else
      line
    end
  end.join("\n")
end

file PARSER_OUT_FILE => PARSER_SRC_FILE do
  system "#{PEGJS} --export-var PEG.parser #{PARSER_SRC_FILE} #{PARSER_OUT_FILE}"
end

directory LIB_DIR

file PEGJS_OUT_FILE => SRC_FILES + [LIB_DIR] do
  File.open(PEGJS_OUT_FILE, "w") do |f|
    f.write(preprocess(File.read(PEGJS_SRC_FILE), SRC_DIR))
  end
end

desc "Generate the grammar parser"
task :parser => PARSER_OUT_FILE

desc "Build the peg.js file"
task :build => PEGJS_OUT_FILE

task :default => :build
