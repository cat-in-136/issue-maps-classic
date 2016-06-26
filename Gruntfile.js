module.exports = function(grunt) {
  var path = require("path");

  grunt.initConfig({
    clean: {
      build: {
        src: ["public"]
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
      },
      js: {
        files: [
          {
            expand: true,
            cwd: "src/js",
            src: ["*.js", "*.es"],
            dest: "public/js",
          }
        ]
      }
    },
    babel: {
      dist: {
        options: {
          sourceMap: true,
          presets: "es2015"
        },
        files: {
          "public/js/setting.js": "public/js/setting.es",
          "public/js/main.js": "public/js/main.es"
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
        tasks: ["copy:js", "babel"],
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
  grunt.registerTask("build", ["copy:bower_components", "copy:main", "copy:js", "babel"]);
  grunt.registerTask("serve", ["connect", "watch"]);
  grunt.registerTask("default", ["serve"]);
};
