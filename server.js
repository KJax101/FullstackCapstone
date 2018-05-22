
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
// var s3 = new AWS.S3()
var passport = require("passport")
var jwt = require("jsonwebtoken")
const { localStrategy, jwtStrategy } = require('./auth');
const jwtAuth = passport.authenticate('jwt', { session: false });
const localAuth = passport.authenticate('local', {session: false});
var albumBucketName = "mypicturebank";
var bucketRegion = 'us-east-2';
var IdentityPoolId = 'us-east-2:cd660831-fb37-42df-8eec-2e88958aa5ca';

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
  // accessKeyId: process.env.aws_access_key_id,
  // secretAccessKey: process.env.aws_secret_access_key
});

var s3 = new AWS.S3({
  apiVersion: '2006-03-01'
});

AWS.config.logger = process.stdout

//Middleware section

passport.use(localStrategy);
passport.use(jwtStrategy);

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
let {username, email, password} = req.body;

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
      createAlbum(user.username)
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

console.log(JWT_EXPIRY)

const createAuthToken = function(user) {
  return jwt.sign({ user }, JWT_SECRET, {
        expiresIn: 86400 // expires in 24 hours
      });
};

app.post('/login', localAuth, function(req, res){
  const authToken = createAuthToken(req.user.serialize());
  if (authToken){
    //res.header('x-auth-token', authToken)
    //res.set({
      //'x-auth-token': authToken
    //})
    app.locals.authToken = authToken
    var filename = "accountpg.html"
    var options = {
      root: path.join(__dirname, 'public')
    }
    res.sendFile(filename, options, function (err) {
    if (err) {
      if (err.code === "ECONNABORT" && res.statusCode == 304) {
        // No problem, 304 means client cache hit, so no data sent.
        console.log('304 cache hit for ' + filename);
        return;
      }
      console.error("SendFile error:", err, " (status: " + err.status + ")");
      if (err.status) {
        res.status(err.status).end();
      }
    }
    else {
      console.log('Sent:', filename);
    }
  })
    //res.json(authToken)
  }
  else {res.sendFile(path.join(__dirname, '/public', 'index.html'))};
  });

function verifyToken(req, res, next) {
    var token = app.locals.authToken
    if (!token)
    {
      return res.status(403).send({ auth: false, message: 'No token provided.' });
    }
    else{
      console.log("VERIFYING")
      jwt.verify(token, JWT_SECRET, function(err, decoded) {
      if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
      // if everything good, save to request for use in other routes
        console.log(decoded.user)
        req.user = decoded.user;
      next();
      });
    }
  }
app.use(express.static(path.join(__dirname, 'public')))
app.get("/user",verifyToken, function(req,res){
  //console.log(app.locals.authToken)
  console.log(req.user)

  // res.set('user', req.user);
  res.json(req.user)
})

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({authToken});
});

var formidable=require('formidable')
var fs=require('fs')
app.post('/upload', verifyToken, function(req, res){
     var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      console.log(files)
      var oldpath = files['image-file'].path;
      // console.log(files['image-file'].path)
      var newpath = '/Users/user/workspace/FullstackCapstone/public/TempPics/' + files['image-file'].name;
      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;
        var file = newpath;
        var fileName = files['image-file'].name;
        var albumName = req.user.username;
        var albumPhotosKey = encodeURIComponent(albumName) + '/';

        var photoKey = albumPhotosKey + fileName;
        s3.upload({
          Key: photoKey,
          Bucket: albumBucketName,
          Body: file,
          ACL: 'public-read'
        }, function(err, data) {
          if (err) {
            return console.log('There was an error uploading your photo: ', err.message);
          }
          console.log('Successfully uploaded photo.');
          var photos = viewAlbum(albumName);
          res.json(photos)
          });
      });
    });
  console.log("uploaded")
  console.log(req.body);
})

//Store Data - layout

//setting up root path
app.get("/", function(req, res){
  // instructing server to return the html by looking in 2 places (arguments) using the
  //filename and the path
console.log("home page loadeddddddd")

res.sendFile(path.join(__dirname, '/public', 'index.html'))
  });

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
    s3.headObject({Key: albumKey.toString(), Bucket: albumBucketName}, function(err, data) {
      if (!err) {
        return console.log('Album already exists.');
      }
      if (err.code !== 'NotFound') {
        return console.log('There was an error creating your album: ' + err);
      }
      s3.putObject({Key: albumKey.toString(), Bucket: albumBucketName}, function(err, data) {
        if (err) {
          return console.log('There was an error creating your album2: ' + err);
        }
        console.log('Successfully created album.');
       // viewAlbum(albumName);
      });
    });
  }

function viewAlbum(albumName) {
  var albumPhotosKey = encodeURIComponent(albumName) + '/';
  s3.listObjects({Prefix: albumPhotosKey}, function(err, data) {
    if (err) {
      return alert('There was an error viewing your album: ' + err.message);
    }
    // `this` references the AWS.Response instance that represents the response
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + albumBucketName + '/';

    var photos = data.Contents
    return photos;
    })
}

//command to listen on a specific port- staring up a server on port 3000
app.listen(3000, function(){
  console.log("server running on port 3000");
});
