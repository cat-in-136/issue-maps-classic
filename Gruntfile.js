module.exports = function(grunt) {
  var path = require("path");

  grunt.initConfig({
    clean: {
      build: {
        src: ["public", "public.zip", "tmp"]
      },
      tmp: {
        src: ["tmp"]
      }
    },

    replace: {
      html: {
        src: ['src/html/*.html'],
        dest: 'public/',
        replacements: [{
          from: 'GOOGLE_API_KEY',
          to: process.env.GOOGLE_API_KEY
        }]
      }
    },
    concat: {
      js: {
        options: {
          sourceMap: true
        },
        files: {
          "tmp/main.es": ["src/js/*.js", "src/js/*.es"]
        }
      }
    },
    babel: {
      js: {
        options: {
          comments: false,
          compact: true,
          sourceMap: true,
          get inputSourceMap() { return grunt.file.readJSON("tmp/main.es.map"); }, // HACK
          presets: ['@babel/preset-env']
        },
        files: {
          "public/js/main.js": "tmp/main.es"
        }
      }
    },
    watch: {
      replace_html: {
        files: "src/html/*",
        tasks: ["replace:html"],
        options: {
          livereload: true
        }
      },
      babel: {
        files: "src/js/*",
        tasks: ["concat:js", "babel:js", "clean:tmp"],
        options: {
          livereload: true
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 9000,
          livereload: true,
          base: "public"
        }
      }
    },
    compress: {
      main: {
        options: {
          archive: "public.zip"
        },
        files: [
          { src: ["public/**"] }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-compress');


  grunt.registerTask("init", ["clean"]);
  grunt.registerTask("build", ["replace:html", "concat:js", "babel:js", "clean:tmp"]);
  grunt.registerTask("serve", ["connect", "watch"]);
  grunt.registerTask("default", ["serve"]);
};
