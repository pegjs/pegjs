"use strict";

(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.benchmarks = factory();
  }
}(this, function() {

  return [
    {
      id:          "json",
      title:       "JSON",
      tests: [
        { file: "example1.json", title: "Example 1" },
        { file: "example2.json", title: "Example 2" },
        { file: "example3.json", title: "Example 3" },
        { file: "example4.json", title: "Example 4" },
        { file: "example5.json", title: "Example 5" }
      ]
    },
    {
      id:          "css",
      title:       "CSS",
      tests: [
        { file: "blueprint/src/reset.css",      title: "Blueprint - reset.css (source)"      },
        { file: "blueprint/src/typography.css", title: "Blueprint - typography.css (source)" },
        { file: "blueprint/src/forms.css",      title: "Blueprint - forms.css (source)"      },
        { file: "blueprint/src/grid.css",       title: "Blueprint - grid.css (source)"       },
        { file: "blueprint/src/print.css",      title: "Blueprint - print.css (source)"      },
        // Contains syntax errors.
        // { file: "blueprint/src/ie.css",         title: "Blueprint - ie.css (source)"         },
        { file: "blueprint/min/screen.css",     title: "Blueprint - screen.css (minified)"   },
        { file: "blueprint/min/print.css",      title: "Blueprint - print.css (minified)"    },
        // Contains syntax errors.
        // { file: "blueprint/min/ie.css",         title: "Blueprint - ie.css (minified)"       },
        { file: "960.gs/src/reset.css",         title: "960.gs - reset.css (source)"         },
        { file: "960.gs/src/text.css",          title: "960.gs - text.css (source)"          },
        { file: "960.gs/src/960.css",           title: "960.gs - 960.css (source)"           },
        { file: "960.gs/src/960_24_col.css",    title: "960.gs - 960_24_col.css (source)"    },
        { file: "960.gs/min/reset.css",         title: "960.gs - reset.css (minified)"       },
        { file: "960.gs/min/text.css",          title: "960.gs - text.css (minified)"        },
        { file: "960.gs/min/960.css",           title: "960.gs - 960.css (minified)"         },
        { file: "960.gs/min/960_24_col.css",    title: "960.gs - 960_24_col.css (minified)"  }
      ]
    }
  ];

}));
