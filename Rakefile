SRC_DIR = "src"
LIB_DIR = "lib"
BIN_DIR = "bin"

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

desc "Generate the grammar parser"
task :parser do
  system "#{BIN_DIR}/pegjs PEG.parser #{SRC_DIR}/parser.pegjs"
end

desc "Build the peg.js file"
task :build do
  File.open("#{LIB_DIR}/peg.js", "w") do |f|
    f.write(preprocess(File.read("#{SRC_DIR}/peg.js"), SRC_DIR))
  end
end

task :default => :build
