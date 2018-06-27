const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

const expect = chai.expect;
const {User} = require('../models/user')
chai.use(chaiHttp);

describe('root', function() {

  before(function() {
    return runServer();
  });


  after(function() {
    return closeServer();
  });
 
  it('success reaching root', function() {
    return chai.request(app)
      .get('/')
      .then(function(res) {
        expect(res).to.have.status(200);
      });
  });

//   it('should  on Post', function() {
//     const testUser = {
//         username:'nickTestUser', password:'123'};
//     return chai.request(app)
//       .get('/getimages')
//       .send(testUser)
//       .then(function(res) {
//         res.should.have.status(304);
//         res.should.be.json;
//         res.body.should.be.a('object');
//         res.body.should.include.keys('username', 'password');
//         res.body.name.should.equal(newRecipe.name);
//         res.body.testUser.should.be.a('array');
//         res.body.testUser.should.include.members(newRecipe.ingredients);
//       });
//   });
// };

// it('should retrieve images on Get', function() {
//     return chai.request(app)
//       .get('/getimages')
//       .then(function(res) {
//         res.should.be.json;
//         res.body.should.be.a('object');
//         res.body.should.include.keys('caption', 'url');
//         res.body.url.should.be.a('string');
//       });
//   });
// });


it('should allow a user to signup for an account', function(done) {
  let newUser = {
    email: "bigdog@gmail.com",
    username: "bridawk",
    password:  "1234"
  }

    chai.request(app)
      .post('/signup')
      .send(newUser)
      .then(function (res) {
        // chai expect assertion syntax
        expect(res).to.have.status(200)
        // after this we should remove "bridawk" from the database
        // bcs multiple tests will require user being removed each time
        // so from the database finding the username and replace with newSS
        User.findOne({username: 'bridawk'})
          .then(function(user){
            user.remove()
            done()
          })
      })

})

  it('should allow the user to enter the account page at login', function(done) {
    let newUser = {
    email: "bigdog@gmail.com",
    username: "bridawk",
    password:  "1234"
  }
    let loginInfo = {
      username: "bridawk",
      password:  "1234"
    }

    chai.request(app)
      .post('/signup')
      .send(newUser)
      .then(function (res) {
        chai.request(app)
        .post('/login')
        .send(loginInfo)
        .then(function(res){
          expect(res).to.have.status(200)
          User.findOne({username: 'bridawk'})
          .then(function(user){
            user.remove()
            done()
          })
        })
      })
  })

  it('should not allow the user to enter the account page at login when username and password are incorrect', function(done) {
    let newUser = {
    email: "bigdog@gmail.com",
    username: "bridawk",
    password:  "1234"
  }
    let loginInfo = {
      username: "bridawk",
      password:  "4321"
    }

    chai.request(app)
      .post('/signup')
      .send(newUser)
      .then(function (res) {
        chai.request(app)
        .post('/login')
        .send(loginInfo)
        .then(function(res){
          expect(res).to.have.status(401)
          User.findOne({username: 'bridawk'})
          .then(function(user){
            user.remove()
            done()
          })
        })
      })

  })

  it ('Should allow a user to log out upon button click', function(done){
    chai.request(app)
    .get('/logout') 
    .then(function(res){
      expect(res).to.have.status(200)
      done()
    })
  }) 

});




  