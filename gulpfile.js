'use strict'

// Inclure gulp
var gulp          = require('gulp'),
    autoprefixer  = require('autoprefixer'),
    browserSync   = require('browser-sync').create(),
    reload        = browserSync.reload;

// Inclure les plugins
var plugins       = require("gulp-load-plugins")({
  //DEBUG: true,
	pattern: ['gulp-*', 'gulp.*', '@*/gulp{-,.}*'],
	replaceString: /^gulp(-|\.)/,
  camelize: true
});

// Adresse de vhost local.
var host          = 'local.static-boilerplate.com';

// Fichiers de départ
var jsFiles       = './js/**/*.js',
    jsVendorFiles = './js/vendor/**/*.js',
    scssFiles     = './css/scss/**/*.scss',
    cssFiles      = './css/**/*.css',
    imgFiles      = './img/**/*.{png,jpg,gif}';

var jsDest        = './js',
    cssDest       = './css',
    scssDest      = './css/scss',
    imgDest       = './img',
    fontDest      = './fonts';


// Serveur
gulp.task('server', function () {
  // Si aucun serveur n'est nécessaire / fonctionnel, commenter à partir d'ici.

  browserSync.init(null, {
    open: 'external', // Remplacer par "false" pour désactiver l'ouverture automatique de la fenêtre
    //server: true, // Commenter cette ligne s'il y A un vhost.
    host: host, // Commenter cette ligne s'il n'y a PAS de vhost.
    proxy: host, // Commenter cette ligne s'il n'y a PAS de vhost.
    injectChanges: true,
    ghostMode: false,
  });
  // Si aucun serveur n'est nécessaire / fonctionnel, commenter jusqu'ici.
});

// Tâche de récupération des assets js, css et fonts des dependencies npm
gulp.task('dependencies', function() {
  gulp.src(plugins.npmFiles(), {base:'./node_modules/'})
    .pipe(plugins.filter(['**/*.css', '!**/*.min.css']))
    .pipe(plugins.rename({dirname: ''}))
    .pipe(gulp.dest(scssDest + '/vendor'));

  gulp.src(plugins.npmFiles(), {base:'./node_modules/'})
    .pipe(plugins.filter('**/*.{eot,svg,ttf,woff,woff2}'))
    .pipe(plugins.rename({dirname: ''}))
    .pipe(gulp.dest(fontDest));

  gulp.src(plugins.npmFiles(), {base:'./node_modules/'})
    .pipe(plugins.filter('**/*.min.js'))
    .pipe(plugins.rename({dirname: ''}))
    .pipe(gulp.dest(jsDest + '/plugins'));
});

// Tâche de vérification du JS custom (pas les plugins)
gulp.task('js:hint', function() {
	return gulp.src([jsFiles, '!'+jsVendorFiles, '!**/*.min.js'])
    .pipe(plugins.jshint('./.jshintrc'))
    .pipe(plugins.jshint.reporter('jshint-stylish'));
});

// Concaténation et minification des JS (plugins + custom)
gulp.task('js:compile', ['js:hint'], function() {
  const scriptsFilter = plugins.filter(['scripts.js'], {restore: true});

  return gulp.src(jsFiles)
    .pipe(scriptsFilter)
    .pipe(plugins.jshint('./.jshintrc'))
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(scriptsFilter.restore)
    .pipe(plugins.filter(['**/*.js', '!**/ie/*', '!**/scripts.min.js']))
    .pipe(plugins.order([
			'**/plugins/*',
			'**/*'
		]))
		.pipe(plugins.concat('scripts.min.js'))
    .pipe(plugins.uglify())
    .on('error', function (err) { plugins.util.log(plugins.util.colors.red('[Error]'), err.toString()); })
		.pipe(gulp.dest(jsDest))
		.pipe(plugins.notify({ message: 'Scripts compilés', onLast: true }));
});

// Surveillance du JS
gulp.task('js:watch', ['js:compile'], function (done) {
    browserSync.reload();
    done();
});

// Compilation des fichiers SCSS
gulp.task('css', function () {
  return gulp.src(scssFiles)
    .pipe(plugins.sourcemaps.init())
		.pipe(plugins.sass().on('error', plugins.sass.logError))
		.pipe(plugins.sourcemaps.write({includeContent: false}))
		.pipe(plugins.sourcemaps.init({loadMaps: true}))
		.pipe(plugins.postcss([autoprefixer]))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest(cssDest))
    .pipe(plugins.filter('**/*.css')) // Filtering stream to only css files
    .pipe(plugins.groupCssMediaQueries()) // Combine les média queries
		.pipe(browserSync.reload({stream:true})) // Injecter les styles quand un fichier css est créé
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(plugins.uglifycss({
      maxLineLen: 80
    }))
    .pipe(gulp.dest(cssDest))
    .pipe(browserSync.reload({stream:true})) // Injecter les styles quand le fichier minifié est créé
    .pipe(plugins.notify({ message: 'Styles compilés correctement', onLast: true }));
});

// Optimisation des images
gulp.task('img', function () {
  gulp.src(imgFiles)
    .pipe(plugins.imagemin({optimizationLevel: 7,progressive: true,interlaced: true}))
    .pipe(gulp.dest(imgDest))
    .pipe(plugins.notify({message: 'Images optimisées', onLast: true}));
});

// Tâche par défault
gulp.task('default', ['dependencies', 'js:compile', 'css', 'img', 'server'], function () {
    gulp.watch(imgFiles, ['img']);
    gulp.watch(scssFiles, ['css']);
    gulp.watch(jsFiles, ['js:watch']);
    gulp.watch('**/*.{php,inc,info,html,png,jpg,gif}').on('change', reload);
});
