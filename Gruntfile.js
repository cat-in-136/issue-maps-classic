module.exports = function(grunt) {
  var path = require("path");

  grunt.initConfig({
    clean: {
      build: {
        src: ["public", "tmp"]
      },
      tmp: {
        src: ["tmp"]
      }
    },
    copy: {
      bower_components: {
        files: [
          {
            expand: true,
            cwd: "bower_components/bootstrap/dist",
            src: ["**"],
            dest: "public/lib/bootstrap"
          },
          {
            expand: true,
            cwd: "bower_components/jquery/dist",
            src: ["**"],
            dest: "public/lib/jquery"
          }
        ]
      },
      main: {
        files: [
          {
            expand: true,
            cwd: "src/html",
            src: ["*.html"],
            dest: "public"
          },
        ],
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
          sourceMap: true,
          get inputSourceMap() { return grunt.file.readJSON("tmp/main.es.map"); }, // HACK
          presets: "es2015"
        },
        files: {
          "public/js/main.js": "tmp/main.es"
        }
      }
    },
    watch: {
      copy_main: {
        files: "src/html/*",
        tasks: ["copy:main"],
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask("bower_install", function () {
    var child = grunt.util.spawn({
      cmd: path.join.apply(path, "node_modules/.bin/bower".split("/")),
      args: ["install"]
    }, this.async());
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });


  grunt.registerTask("init", ["clean", "bower_install"]);
  grunt.registerTask("build", ["copy:bower_components", "copy:main", "concat:js", "babel:js", "clean:tmp"]);
  grunt.registerTask("serve", ["connect", "watch"]);
  grunt.registerTask("default", ["serve"]);
};
