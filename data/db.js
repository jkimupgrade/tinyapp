const bcrypt = require('bcrypt');

// initial url database
const urlDatabase = {
  'b2xVn2': {
    longURL:'http://www.lighthouselabs.ca',
    userID: 'test01' , 
    analytics: { created: new Date(), numVisitor: 0, numUniqueVisitor: 0 } },
    visitors: [],
    trackers: [],
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'test01',
    analytics: { created: new Date(), numVisitor: 0, numUniqueVisitor: 0 } },
    visitors: [],
    trackers: [],
  'elb0o6': {
    longURL: 'http://www.reddit.com',
    userID: 'test02',
    analytics: { created: new Date(), numVisitor: 0, numUniqueVisitor: 0} },
    visitors: [],
    trackers: []
};

// initialize users object
const test1 = bcrypt.hashSync('test1', 10);
const test2 = bcrypt.hashSync('test2', 10);

const users = {
  'test01': {
    id: 'test01',
    email: 'test1@test1',
    password: test1
  },
  'test02': {
    id: 'test02',
    email: 'test2@test2',
    password: test2
  }
}; 

module.exports = {
  urlDatabase,
  users
};