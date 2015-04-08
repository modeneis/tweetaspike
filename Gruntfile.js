'use strict';

module.exports = function(grunt) {

   // Project configuration.

   grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // CONFIG ===================================/
 
		 watch: {
		     compass: {
		      files: ['app/styles/*.{scss,sass}'],
		      tasks: ['compass:dev']
		     }
		},
		compass: {
		  dev: {
		      options: {              
		          sassDir: ['app/styles'],
		          cssDir: ['.tmp/styles'],
		          environment: 'development'
		      }
		  },
		}

   });
 
   // DEPENDENT PLUGINS =========================/
 
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-contrib-compass');
 
   // TASKS =====================================/
 
   grunt.registerTask('default', ['compass:dev' , 'watch']);
 
};
