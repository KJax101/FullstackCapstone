//
'use strict';
//const {router} = require('./router');
const {localStrategy, jwtStrategy} = require('./passportStrategies');

//add router to export later!!!
module.exports = {localStrategy, jwtStrategy};
