var gulpLog;
try {
  gulpLog = require('gulp-util').log;
} catch(e) {
  gulpLog = console;
}

module.exports = gulpLog;
