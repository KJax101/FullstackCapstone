const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

const expect = chai.expect;

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


it('should login on POST', function(done) {
    const testUser = {
        username: 'nickTestUser', password: '123'};
    return chai.request(app)
      .post('/loginTest')
      .send(testUser)
    .end(function (err, res) {
        if (err) done(err);
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.include.keys('authToken');
        res.body.authToken.should.be.a('string');
        done()
      })
  });
});


  