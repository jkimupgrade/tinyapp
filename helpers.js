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

module.exports = {
  generateRandomString,
  getUserByEmail
};