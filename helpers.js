const bcrypt = require('bcrypt');

// generate 6-digit random alphanumeric string
const generateRandomString = function() { 
  return Math.random().toString(36).substr(2, 6);
};

// retrieve userID from email
const getUserByEmail = function(inputEmail, userData) {
  for (key in userData) {
    if (userData[key].email === inputEmail) {
      return userData[key].id;
    }
  };
  return undefined; // no matching user
};

// check if email exists in users database
const checkEmail = function(email, userData) {
  for (key in userData) {
    if (userData[key].email === email) {
      return true;
    }
  };
  return false; 
};

// check if password exists in users database
const checkPassword = function(inputPassword, userData) {
  for (key in userData) {
    if(bcrypt.compareSync(inputPassword, userData[key].password)) {
      return true;
    }
  };
  return false;
};

// retrieve URLs for a given user_id
const getUrls = function(lookUpId, urlData) {
  let filteredUrls = {};
  for (key in urlData) { // key=shortURL
    if (urlData[key].userID === lookUpId) {
      filteredUrls[key] = urlData[key].longURL;
    }
  };
  // check if the user has any URLs
  if (Object.keys(filteredUrls).length === 0) {
    return undefined;
  } else {
    return filteredUrls;
  }
};

// check if shortURL exists in database
const checkUrl = function(shortURL, urlData) {
  for (key in urlData) {
    if (key === shortURL) {
      return true;
    }
  };
  return false;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  checkEmail,
  checkPassword,
  getUrls,
  checkUrl
};