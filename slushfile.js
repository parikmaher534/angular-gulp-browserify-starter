;(function() {
    
    'use strict';

    var includeAll = require('include-all'),
        gulp = require('gulp'),
        install = require('gulp-install'),
        conflict = require('gulp-conflict'),
        template = require('gulp-template'),
        rename = require('gulp-rename'),
        _ = require('underscore.string'),
        inquirer = require('inquirer'),
        path = require('path');

    function format(string) {
        var username = string.toLowerCase();
        return username.replace(/\s/g, '');
    }

    var defaults = (function () {
        var workingDirName = path.basename(process.cwd()),
          homeDir, osUserName, configFile, user;

        if (process.platform === 'win32') {
            homeDir = process.env.USERPROFILE;
            osUserName = process.env.USERNAME || path.basename(homeDir).toLowerCase();
        }
        else {
            homeDir = process.env.HOME || process.env.HOMEPATH;
            osUserName = homeDir && homeDir.split('/').pop() || 'root';
        }

        configFile = path.join(homeDir, '.gitconfig');
        user = {};

        if (require('fs').existsSync(configFile)) {
            user = require('iniparser').parseSync(configFile).user;
        }

        return {
            appName: workingDirName,
            userName: osUserName || format(user.name || ''),
            authorName: user.name || '',
            authorEmail: user.email || ''
        };
    })();

    gulp.task('default', function (done) {
        var prompts = [{
            name: 'appName',
            message: 'What is the name of your project?',
            default: defaults.appName
        }, {
            type: 'confirm',
            name: 'moveon',
            message: 'Continue?'
        }];
        //Ask
        inquirer.prompt(prompts,
            function (answers) {
                if (!answers.moveon) {
                    return done();
                }

                answers.nameDashed = _.slugify(answers.appName);
                answers.modulename = _.camelize(answers.nameDashed);

                return gulp.src(__dirname + '/templates/**')
                    .pipe(rename(function (file) {
                        if (file.basename[0] === '_') {
                            file.basename = '.' + file.basename.slice(1);
                        }
                    }))
                    .pipe(conflict('./'))
                    .pipe(gulp.dest('./'))
                    .pipe(install())
                    .on('end', function () {
                        gulp.src(__dirname + '/templates/app/**').pipe(template(answers)).on('end', function () {
                            done();
                        })
                    });
            });
    });


    /**
     * Loads task modules from a relative path.
     */
    function loadTasks(relPath) {
        return includeAll({
            dirname: require('path').resolve(__dirname, relPath),
            filter: /(.+)\.js$/
        }) || {};
    }
    // *
    //  * Invokes the function from a Gulp configuration module with
    //  * a single argument - the `gulp` object.

    function addTasks(tasks) {
        for (var taskName in tasks) {
            if (tasks.hasOwnProperty(taskName)) {
                tasks[taskName](gulp);
            }
        }
    }
    /**
     * Add all Gulp tasks to the gulpfile.
     * Tasks are in `tasks/`
     */
    addTasks(loadTasks('tasks/'));

    // // require('gulp-load-tasks')(__dirname + '/tasks');
    //gulp.task('default');

})();
