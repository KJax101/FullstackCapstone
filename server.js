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
let { DATABASE_URL, JWT_SECRET, JWT_EXPIRY} = require('./config');

  // coding for travis testing, required for travis to pass
    DATABASE_URL = DATABASE_URL || "mongodb://Kjax101:openme99@ds011735.mlab.com:11735/kgfullstackcap"
    JWT_SECRET = JWT_SECRET || "secret"
    JWT_EXPIRY = JWT_EXPIRY || "7d"

// Using Morgan for logging entries
var logger = require('morgan');
// Importing Mongoose libray which allows communication with Mongo DB
var mongoose = require('mongoose');
var {User} = require('./models/user');
var AWS = require("aws-sdk")
var s3 = new AWS.S3({ accessKeyId: "AKIAJCDYZDIDLL6XNNKQ", secretAccessKey: "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", region: 'us-east-2', stage: 'prod'});
var passport = require("passport")
var jwt = require("jsonwebtoken")
const { localStrategy, jwtStrategy } = require('./auth');
const jwtAuth = passport.authenticate('jwt', { session: false });
const localAuth = passport.authenticate('local', {session: false});
var albumBucketName = "mypicturebank";
var bucketRegion = 'us-east-2';
var IdentityPoolId = 'us-east-2:cd660831-fb37-42df-8eec-2e88958aa5ca';
app.use(express.static(path.join(__dirname, 'public')))

// AWS.config.update({
//   region: bucketRegion,
//   // see lines 42=45
//   // credentials: new AWS.CognitoIdentityCredentials({
//   //   IdentityPoolId: IdentityPoolId
//   // })
//   accessKeyId: "AKIAJCDYZDIDLL6XNNKQ", // process.env.aws_access_key_id,
//   secretAccessKey: "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" // process.env.aws_secret_access_key
// });

// not usre about this below
// var s3 = new AWS.S3({
//   apiVersion: '2006-03-01'
// });

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
// Enable CORS headers
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Acccept");
  next();
});

/* This is for testing without a database connection:
function verifyFakeToken(req, res, next) {
  console.log("Verifying fake token");
  next();
}
*/



//DB Connection using (mongodb://<dbuser>:<dbpassword>@ds011735.mlab.com:11735/kgfullstackcap)
var mongoConnectString = process.env.DATABASE_URL
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
      if (count > 0) {
        // There is an existing user with the same username
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      // If there is no existing user, hash the password
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({
        username,
        email,
        userAccountImages: [],
        password: hash
      });
    })
    .then(user => {
      createAlbum(user.username)
      res.redirect('index.html');
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
app.get('/logout', function(req, res){
  app.locals.authToken = ""
  var filename = "index.html"
  var options = {
    root: path.join(__dirname, 'public')
  }
    res.status(200).end();
    });

app.post('/login', localAuth, function(req, res){
  const authToken = createAuthToken(req.user.serialize());
  console.log("define authtoken")
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
  else {res.redirectsendFile(path.join(__dirname, '/public', 'accountpg.html'))};
  });

function verifyToken(req, res, next) {
    var token = app.locals.authToken
    if (!token)
    {
      console.log('No token provided')
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

app.get("/user",verifyToken, function(req,res){
  console.log('using get /user')
  //console.log(app.locals.authToken)
  //console.log(req.user)

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


app.get('/images', verifyToken, function(req, res) {
  console.log('Getting images')

  // Get images this user has in S3 (with the user prefix)
 var albumName = req.user.username;
  var albumPhotosKey = encodeURIComponent(albumName) + '/';
  s3.listObjects({Prefix: albumPhotosKey, Bucket: albumBucketName}, function(err, data) {
    if (err) {
      // return alert('There was an error viewing your album: ' + err.message);
      console.log('There was an error viewing your album: ' + err.message)

    }

    var userName = req.user.username
    var c = data['Contents'] || new array();
    //console.log("Viewing album:" + c['Prefix'])
    connectCaptionsImgs(c, userName)
    // Return the URLs

  }
)
function connectCaptionsImgs(c, username){
User.find({username})
    .then(user =>{
      var captionAndUrls = [];
      console.log('USER STUFFF', user)
      var images = user[0].userAccountImages
      console.log("USER IMAGES", images)
      for(var j = 0; j < images.length; j++){
        for (var i = 1; i < c.length; i++) {
            //console.log("E: " + c[i]['Key']);
            var url = "https://"+albumBucketName+".s3.amazonaws.com/"+c[i]['Key']
            var fileName =  url.split("/")[4];
            if(images[j].filename == fileName){
              var newObj = {caption: images[j].imgCaption, url: url};
              console.log("NEWOBJJJ", newObj)
              captionAndUrls.push(newObj);
            }
        }
      }
      console.log("RESPONSE STUFFFFFF", captionAndUrls);
      res.json(captionAndUrls)
    })
    .catch(err => { console.log(err) })
}
  // and return as an array
});

app.post('/images', verifyToken, function(req, res){

    console.log('STEP1: in upload function');

   var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      //console.log(files)
      // var oldpath = files['photo'].path;
      // console.log(files['image-file'].path)
     // var newpath = '/Users/user/workspace/FullstackCapstone/public/TempPics/' + files['image-file'].name;
 //     fs.rename(oldpath, newpath, function (err) {
  //      if (err) throw err;
        //var file = files['photo'].path;
        var file = fs.readFile(files['photo'].path, function (err, data) {
          if (err) {
            console.log("CAN'T READ FILE");
            throw err;
          }

          var fileName = files['photo'].name;
          var albumName = req.user.username;
          var albumPhotosKey = encodeURIComponent(albumName) + '/';

          var photoKey = albumPhotosKey + fileName;
          console.log("photo key " + photoKey)
          s3.upload({
            Key: photoKey,
            Bucket: albumBucketName,
            Body: data, // file,
            ACL: 'public-read'
          }, function(err, data) {
            if (err) {
              return console.log('There was an error uploading your photo: ', err.message);
            }
            //console.log(data);
            // var photos = viewAlbum(albumName);
            // res.json(photos)
            var albumPhotosKey = encodeURIComponent(albumName) + '/';
  s3.listObjects({Prefix: albumPhotosKey, Bucket: albumBucketName}, function(err, data) {
    if (err) {
      // return alert('There was an error viewing your album: ' + err.message);
      console.log('There was an error viewing your album: ' + err.message)
    }
    // `this` references the AWS.Response instance that represents the response
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + albumBucketName + '/';
    var photos = data.Contents
    //console.log("photos from /upload", photos)
    var urls = [];
    var c = photos;
    console.log("Viewing album:" + c['Prefix'])
    for (var i = 1; i < c.length; i++) {
        //console.log("E: " + c[i]['Key']);
        urls.push("https://"+albumBucketName+".s3.amazonaws.com/"+c[i]['Key']);
    }
    // Return the URLs
    res.send(urls)
    // return photos;
    })
            });
          // mongo-save imgFilename
          console.log("MongoTestingStatement!!!", req.user)
          var userName = req.user.username
          saveImageToUser(fileName, userName)
        });
     // });
    });
function saveImageToUser(fileName, username){
User.find({username})
    .then(user =>{
      console.log('USER STUFFF', user)
      var imgObj = {
        imgCaption: "",
        filename: fileName
      }
      user[0].userAccountImages.push(imgObj);

      user[0].save();
    })
    .catch(err => { console.log(err) })
}

  console.log("uploaded")
  console.log(req.body);
})
app.post("/captionPhoto", verifyToken, function(req,res){
console.log("USERRRRRRRRRRR CAPTION", req.user)
var username = req.user.username;
  User.find({username})
      .then(user =>{
        console.log('USER STUFFF', user)
        var imgObj = {
          imgCaption: req.body.imgCaption,
          filename: req.body.filename
        }
        var images = user[0].userAccountImages
        for(var i = 0; i < images.length; i++){
            if(images[i].filename == imgObj.filename){
              console.log(imgObj)
              images[i] = imgObj
            }
        }
        user[0].save();
      })
      .catch(err => { console.log(err) })
    res.json({success: "success"})
})
// deletingPhoto from aws bucket
app.post("/deletePhoto", verifyToken, function(req,res){
  s3.deleteObject({
            Key: req.body.photoKey,
            Bucket: req.body.albumBucketName
          }, function(err, data) {
    if (err) {
      //return console.log('There was an error deleting your photo: ', err.message);
    }
    //console.log('Successfully deleted photo.');
    var userName = req.user.username
    console.log("PHOTO KEY FOR DELETE OBJECT", req.body.photoKey)
    var fileName = req.body.photoKey.split("/")[1];
    console.log("GUESSING WHAT THE FILENAME IS", fileName)
    deleteFromMongo(userName, fileName)
  });
  function deleteFromMongo(username, filename){
    User.find({username})
        .then(user =>{
          console.log('USER STUFFF', user)
          // var imgObj = {
          //   imgCaption: req.body.imgCaption,
          //   filename: req.body.filename
          // }
          var images = user[0].userAccountImages
          for(var i = 0; i < images.length; i++){
              if(images[i].filename == filename){
                user[0].userAccountImages.splice(i, 1);
              }
          }
          user[0].save();
        })
        .catch(err => { console.log(err) })
  }
    res.json({Success: "Successfully deleted"})
})


//Store Data - layout

//setting up root path
app.get("/", function(req, res){
  // instructing server to return the html by looking in 2 places (arguments) using the
  //filename and the path
//console.log("home page loaded")

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
  s3.listObjects({Prefix: albumPhotosKey, Bucket: albumBucketName}, function(err, data) {
    if (err) {
      // return alert('There was an error viewing your album: ' + err.message);
      console.log('There was an error viewing your album: ' + err.message)
    }
    // `this` references the AWS.Response instance that represents the response
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + albumBucketName + '/';
    var photos = data.Contents
    return photos;
    })
}

//command to listen on a specific port- staring up a server on port 3000
// app.listen(3000, function(){
//   console.log("server running on port 3000");
// });
// app.post('/loginTest', function(req, res){
//   const authToken = createAuthToken(req.user.serialize());
//   console.log("define authtoken")
//   if (authToken){
//   res.status(201).send({authToken: authToken})
//   }
// })

let server;

function runServer() {
  const port = process.env.PORT || 3000;
  return new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      console.log(`Your app is listening on port ${port}`);
      resolve(server);
    }).on('error', err => {
      reject(err)
    });
  });
}

function closeServer() {
  return new Promise((resolve, reject) => {
    console.log('Closing server');
    server.close(err => {
      if (err) {
        reject(err);
        // so we don't also call `resolve()`
        return;
      }
      resolve();
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};
