
//importing express app as the variable
var express = require('express');
// creating an (instance) of express
var app = express();

// we will use this to create a root file path so express 
//    knows where to look for the html file
var path = require('path');
var bodyParser = require('body-parser');

//Importing .env library and assigning as var
var dotenv = require('dotenv').config();
const { DATABASE_URL, JWT_SECRET, JWT_EXPIRY} = require('./config');


// Using Morgan for logging entries
var logger = require('morgan');
// Importing Mongoose libray which allows communication with Mongo DB
var mongoose = require('mongoose');
var {User} = require('./models/user');
var AWS = require("aws-sdk")
var s3 = new AWS.S3()

AWS.config.logger = process.stdout

//Middleware section
app.use(express.static(path.join(__dirname, 'public')));

// app.use(function(req, res, next) {
//   app.locals.currentUser = req.user || null
//   app.locals.isLoggedIn = !!req.user
//   // !!req.user
//   next()
// })
// function isLoggedIn(req, res, next) {
//   if(req.isAuthenticated()) return next()
//   res.redirect('/')
// }

//Logs request details
app.use(logger('dev'));
// support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

//DB Connection using (mongodb://<dbuser>:<dbpassword>@ds011735.mlab.com:11735/kgfullstackcap)
//var mongoConnectString = process.env.DATABASE_URL
mongoose.connect(DATABASE_URL, function(err){
	if(err) return console.log(err)
		console.log("Connected to mLab DB")
});

app.post("/signup", function(req, res){
console.log(req.body)
let {username, password} = req.body;

return User.find({username})
    .count()
    .then(count => {
      // if (count > 0) {
      //   // There is an existing user with the same username
      //   return Promise.reject({
      //     code: 422,
      //     reason: 'ValidationError',
      //     message: 'Username already taken',
      //     location: 'username'
      //   });
      // }
      // If there is no existing user, hash the password
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({
        username,
        email,
        password: hash
      });
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });
})

//Authorization Section
var passport = require("passport")
var jwt = require("jsonwebtoken")
const { localStrategy, jwtStrategy } = require('./auth');
passport.use(localStrategy);
passport.use(jwtStrategy);
console.log(JWT_EXPIRY)

const createAuthToken = function(user) {
  return jwt.sign({user}, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const localAuth = passport.authenticate('local', {session: false});
app.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user.serialize());
  if (authToken){
    res.sendFile(path.join(__dirname, '/public', 'accountpg.html'));
  }
  else {res.sendFile(path.join(__dirname, '/public', 'index.html'))};
  });

//   var fileName = "accountpg.html";
//   res.sendFile(fileName, options, function (err) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log('Sent:', fileName);
//     }
//   });
// });
const jwtAuth = passport.authenticate('jwt', {session: false});

app.get("/user", jwtAuth, function(req,res){
  const authToken = createAuthToken(req.user);
  console.log(req.user)
  // res.json()
})

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({authToken});
});

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()) return next()
  res.redirect('/')
}


//Store Data - layout

//setting up root path
app.get("/", function(req, res){
	// instructing server to return the html by looking in 2 places (arguments) using the 
	//filename and the path

createAlbum("Kjaxtest2");
	res.render("index.html");
	});
//command to listen on a specific port- staring up a server on port 3000
app.listen(3000, function(){
	console.log("server running on port 3000");
});

var albumBucketName = 'mypicturebank';
var bucketRegion = 'us-east-2';
var IdentityPoolId = 'us-east-2:cd660831-fb37-42df-8eec-2e88958aa5ca';

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  }),
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key
});

var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
});
// s3.getBucketAcl(albumBucketName, function(err, data) {
//   if (err) {
//     console.log("Error", err);
//   } else if (data) {
//     console.log("Success", data.Grants);
//   }
// });

 //validation and error checks for album creation
function createAlbum(albumName) {
  albumName = albumName.trim();
  if (!albumName) {
    return console.log('Album names must contain at least one non-space character.');
  }
  if (albumName.indexOf('/') !== -1) {
    return console.log('Album names cannot contain slashes.');
  }
  var albumKey = encodeURIComponent(albumName) + '/';
  console.log(albumKey)
  s3.headObject({Key: albumKey}, function(err, data) {
    if (!err) {
      return console.log('Album already exists.');
    }
    if (err.code !== 'NotFound') {
      return console.log('There was an error creating your album: ' + err);
    }
    s3.putObject({Key: albumKey}, function(err, data) {
      if (err) {
        return console.log('There was an error creating your album2: ' + err);
      }
      console.log('Successfully created album.');
     // viewAlbum(albumName);
    });
  });
}


