const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const imageSchema = new mongoose.Schema({
  filename: String,
  fileExtension: String,
  fileCategory: String
})

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {type: String, default: ''},
  userAccountImages: [imageSchema]
});


UserSchema.methods.serialize = function() {
  return {
    username: this.username || '',
    email: this.email || ''
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

// exporting js from one file to another
module.exports = {User};

 



