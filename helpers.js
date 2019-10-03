const bcrypt = require('bcrypt');

// generate 6-digit random alphanumeric string
const generateRandomString = function() { 
  return Math.random().toString(36).substr(2, 6);
};

// retrieve userID from email
const getUserByEmail = function(inputEmail, database) {
  for (key in database) {
    if (database[key].email === inputEmail) {
      return database[key].id;
    }
  };
  return undefined; // no matching user
};

// check if email exists in users database
const checkEmail = function(email) {
  for (user in users) {
    if (users[user].email === email) {
      return true;
    }
  };
  return false; 
};

// check if password exists in users database
const checkPassword = function(inputPassword) {
  for (key in users) {
    if(bcrypt.compareSync(inputPassword, users[key].password)) {
      return true;
    }
  };
  return false;
};

// retrieve URLs where the userID is equal to the id of the currently logged in user
const getUrls = function(lookUpId) {
  let filteredUrls = {};
  for (key of Object.keys(urlDatabase)) { // key=shortURL
    if (urlDatabase[key].userID === lookUpId) {
      filteredUrls[key] = urlDatabase[key].longURL;
    }
  };
  if (Object.keys(filteredUrls).length === 0) {
    return false;
  }
  return filteredUrls;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  checkEmail,
  checkPassword,
  getUrls
};