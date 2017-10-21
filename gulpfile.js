///////////
// Setup //
///////////

//url must be the actual shop url-it will not work if there is a redirect on the url you set
//Browsersync is not required, if you don't want to use it just don't use the localhost proxy

var projectName = 'wedding',
	url = 'http://wedding.dev',
	jsLibs = [
        'src/js/libs/jquery-2.2.4.min.js',
        'src/js/libs/*.js',
        'src/js/libs/frameworks/vue.js'
    ],
	jsfiles = [
		'!src/js/libs/jquery-2.2.4.min.js',
		'src/js/base/define.js',
		'src/js/modules/*.js',
		'src/js/base/router.js'
	];


/////////////
// Modules //
/////////////
var gulp = require('gulp'),
	jshint = require ('gulp-jshint'),
	concat = require('gulp-concat'),
	stripDebug = require('gulp-strip-debug'),
	uglify = require('gulp-uglify'),
	sass = require('gulp-sass'),
	notify = require('gulp-notify'),
	gutil = require('gulp-util'),
	rename = require('gulp-rename'),
	size = require('gulp-filesize'),
	autoprefixer = require('autoprefixer'),
	postCss = require('gulp-postcss'),
	mqPacker = require('css-mqpacker'),
	pxToRem = require('postcss-pxtorem'),
	sourceMaps = require('gulp-sourcemaps'),
	doiuse = require('doiuse'),
	cssNano = require('gulp-cssnano'),
	browserSync = require('browser-sync').create(),
	shell = require('gulp-shell'),
	filter = require('gulp-filter'),
	watch = require('gulp-watch'),
	cacheBuster = require('postcss-cachebuster'),
	mkdirp = require('mkdirp'),
	gitStatus = require('git-rev-sync'),
	babel = require('gulp-babel'),
    addsrc = require('gulp-add-src'),
	fs = require("fs"),
	git_branch = '';

///////////
// Tasks //
///////////

    var devProcessors = [
	        autoprefixer(),
	        pxToRem({rootValue: 16, replace: true, mediaQuery: true}),
	        cacheBuster({cssPath: '/assets', type:'mtime'})
    	],
    	prodProcessors = [
    		pxToRem({rootValue: 16, replace: true, mediaQuery: true}),
    		mqPacker({sort: true}),
	        cacheBuster({cssPath: '/assets', type:'mtime'})
    	];

////////
// JS //
////////
gulp.task('js:hint', function(){
	gutil.log(gutil.colors.blue('--> Validating JS '));
	gulp.src(['src/js/base/*.js', 'src/js/modules/*.js'])
 		.pipe(jshint())
		.pipe(notify(function(file){
			if (file.jshint.success) {
				return false;
			}
			return file.relative + " has errors!";
		}))
		.pipe(jshint.reporter('jshint-stylish', { verbose: true }));
});

gulp.task('js:concat', function(){

	gutil.log(gutil.colors.blue('--> Concatenating JS '));
	gulp.src(jsfiles)
		.pipe(babel({
            presets: ['es2015'],
            compact: false
        }))
        .pipe(addsrc.prepend(jsLibs))
		.pipe(concat(projectName + '.min.js'))
		.pipe(gulp.dest('assets/'))
		.pipe(size())
	    .pipe(browserSync.stream())
	    .pipe(notify({ title: projectName + ' JS', message: 'Browser Refreshed' }));
});

gulp.task('js:uglify', function(){
	var vuePosition = jsfiles.indexOf('src/js/libs/frameworks/vue.js');

	if (vuePosition > -1){
		jsfiles[vuePosition] = 'src/js/libs/frameworks/vue.min.js';
	}

	gutil.log(gutil.colors.blue('--> Uglifying JS '));
	gulp.src(jsfiles)
		.pipe(babel({
            presets: ['es2015'],
            compact: false
        }))
        .pipe(addsrc.prepend(jsLibs))
		.pipe(concat(projectName + '.min.js'))
		.pipe(uglify({
			compress: {
				drop_console: true
			}
		}))
		.pipe(gulp.dest('assets/'))
		.pipe(size())
	    .pipe(notify({ title: projectName + ' JS', message: 'Uglified' }));
});

/////////
// CSS //
/////////

gulp.task('css:postsass', function(){

	gutil.log(gutil.colors.blue('--> Compiling CSS Stuffs '));
	gulp.src('src/css/scss/*.scss')
		.pipe(sourceMaps.init())
		.pipe(sass().on('error', handleSassError))
		.pipe(postCss(devProcessors))
		.pipe(size())
		.pipe(sourceMaps.write())
		.pipe(rename(projectName + '.min.css'))
		.pipe(gulp.dest('assets/'))
		.pipe(notify({ title: projectName + ' CSS', message: 'CSS Refreshed' }));
});

gulp.task('css:post_build', function(){

	gutil.log(gutil.colors.blue('--> Making CSS Stuffs Smaller '));
	gulp.src('src/css/scss/*.scss')
		.pipe(sass().on('error', function(err){
			gutil.log(gutil.colors.bold.white.bgRed('\n \n [SASS] ERROR \n'));
			console.error('', err.message);
			return notify({
				title: 'Sass Error',
				message: 'Error on line ' + err.line + ' of ' + err.file
			}).write(err);
		}))
		.pipe(postCss(prodProcessors))
		.pipe(cssNano({autoprefixer: { add: true }}))
		.pipe(rename(projectName + '.min.css'))
		.pipe(size())
		.pipe(gulp.dest('assets/'))
		.pipe(notify({ title: projectName + ' CSS', message: 'CSS Refreshed' }));
});

function handleSassError(err){
	gutil.log(gutil.colors.bold.white.bgRed('\n \n [SASS] ERROR \n'));
	console.error('', err.message);
	return notify({
		title: 'Sass Error',
		message: 'Error on line ' + err.line + ' of ' + err.file
	}).write(err);
}

////////////
// LIQUID //
////////////
function isChanged(file) {
    return file.event === 'change' || file.event === 'add';
}

function isDeleted(file) {
    return file.event === 'unlink';
}

var filterChanged = filter(isChanged),
	filterDeleted = filter(isDeleted);

var watchSrc = ['assets/**/*', '!assets/*.js', '!assets/*.css', '!assets/.DS_Store', 'layout/**/*.*', 'snippets/**/*.*', 'sections/**/*.*', 'templates/**/*.*', 'config/*.*', 'locales/*.*'];

///////////////////
// Coupled Tasks //
///////////////////

gulp.task('build', ['js:uglify', 'css:post_build'], function(){
	gulp.src('gulpfile.js').pipe(notify({
		title: 'Build Scripts',
		message: 'Finished!'
	}));
});

gulp.task('default', ['js:hint','js:concat','css:postsass'], function() {
	fs.readFile('config.yml', 'utf-8', function(err, _data) {

		browserSync.init({
		    proxy: url,
		    open: false,
		    xip: false, //turn this on if using typekit, point your typekit to xip.io
		    ghostMode: { //turn this off if you don't want other people scrolling on you
		        clicks: true,
		        forms: true,
		        scroll: true
		    }
		});
	});

	// watch for changes in src
	gulp.watch('src/js/**/*.js', ['js:hint', 'js:concat']);

	// watch for sass changes
	gulp.watch('src/css/scss/**/*.scss', ['css:postsass']);

});