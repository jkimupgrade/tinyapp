const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.set('view engine', 'ejs'); // templating engine

const urlDatabase = {
  'b2xVn2': { longURL:'http://www.lighthouselabs.ca', userID: 'test01' },
  '9sm5xK': { longURL: 'http://www.google.com', userID: 'test01'}
};
// initialize users object
const users = {
  'test01': {
    id: 'test01',
    email: 'test1@test1',
    password: 'test1'
  },
  'test02': {
    id: 'test02',
    email: 'test2@test2',
    password: 'test2'
  }
}; 
// generate 6-digit random alphanumeric string
const generateRandomString = function() { 
  return Math.random().toString(36).substr(2, 6);
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
// retrieve userID from email
const getUserID = function(email) {
  for (user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  };
  return null; // no matching user
};
// check if password exists in users database
const checkPassword = function(password) {
  for (user in users) {
    if (users[user].password === password) {
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
//////////////////////////////////////////////
/////////////////// GET //////////////////////
//////////////////////////////////////////////
app.get('/', (req, res) => {
  res.send('Hello!');
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html?\n');
});

// load 'My URLs' page
app.get('/urls', (req, res) => {
  // 1. check if user is logged in 2. only display urls relevant to the user
  if (!users[req.cookies['user_id']]) { // not logged in (i.e. cookie empty)
    let templateVars = {
      user: null
    };
    res.render('login_alert', templateVars);
  } else {
    let templateVars = { 
      urls: getUrls(req.cookies['user_id']),
      user: users[req.cookies['user_id']]
     };
     res.render('urls_index', templateVars);
    }
});

// load 'Create New URL' page
app.get('/urls/new', (req, res) => { // GET route to show the form
  console.log('user NOT logged in?', !users[req.cookies['user_id']]);
  if (!users[req.cookies['user_id']]) { // not logged in
    res.redirect('/login'); // redirect to login page if not logged in
  } else { // logged in
    templateVars = {
      user: users[req.cookies['user_id']]
    };
    res.render('urls_new', templateVars);
  }
});

// load page showing results of newly added longURL and the corresponding shortURL (with the option to edit)
app.get('/urls/:shortURL', (req, res) => {
  if (!req.cookies['user_id']) { // if not logged in, then alert
    let templateVars = {
      user: null
    };
    res.render('login_alert', templateVars);

  } else if (!getUrls(req.cookies['user_id'])) { // if the urls does not belong to :id, then alert
    let templateVars = {
      user: null,
      longURL: null,
      shortURL: null
    };
    res.render('urls_show_alert', templateVars);
  } else {
    let templateVars = { 
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.cookies['user_id']]
    };
    res.render('urls_show', templateVars);
  }  
});

// load page corresponding to the shortURL that the user inputs
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// load login page
app.get('/login', (req, res) => {
  // only show login page if they're not logged in
  // if they're logged in --> redirect to /urls page
  if (!users[req.cookies['user_id']]) { // not logged in
    templateVars = {
      user: null   
    };
    res.render('login', templateVars);
  } else { // logged in
    res.redirect('/urls');
  }
});

// // load login_alert page
// app.get('/login_alert', (req, res) => {
//   res.render('login_alert');
// })

// loading the logout page will clear cookies and redirect to 'My URLs' page
app.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  if (!users[req.cookies['user_id']]) { // not logged in
    templateVars = {
      user: null
    };
    res.render('register', templateVars);
  } else { // logged in
    res.redirect('/urls');
  }
});

//////////////////////////////////////////////
/////////////////// POST /////////////////////
//////////////////////////////////////////////
// add new URLs to database
app.post('/urls', (req, res) => {
  console.log('NewURL being added', req.body.longURL); // Log the POST request body to the console
  urlDatabase[generateRandomString()] = { // update urlDatabase with newly generated short URL, along with longURL and userID
    longURL: req.body.longURL,
    userID: req.cookies['user_id']
  };
  let keys = Object.keys(urlDatabase);
  res.redirect(`/urls/${keys[keys.length - 1]}`);
});

// delete entry on My URLs page (button)
app.post('/urls/:shortURL/delete', (req, res) => {
  // if not logged in, then alert
  if (!req.cookies['user_id']) {
    console.log('DELETE DENIED');
    res.redirect('/urls');
  } else {
    console.log('DELETE SUCCESS');
    delete urlDatabase[req.params.shortURL];
    console.log(`ShortURL ${req.params.shortURL} has been deleted`);
    res.redirect('/urls');
  }
});

// receive newURL from user for specific shortURL (:id)
app.post('/urls/:id', (req, res) => {
  // if not logged in, then alert
  if (!req.cookies['user_id']) {
    console.log('EDIT DENIED')
    let templateVars = {
      user: null
    };
    res.render('login_alert', templateVars);

  } else {
    console.log('EDIT SUCCESS'); 
    urlDatabase[req.params.id] = req.body.newURL; // update database with newURL
    res.redirect('/urls');
  }
});

app.post('/login', (req, res) => {
  // if email cannot be found, return 403
  console.log(checkEmail(req.body.email));
  console.log(checkPassword(req.body.password));
  
  if (!checkEmail(req.body.email)) {
    res.status(403).send('Invalid email');
  } else {
    if (!checkPassword(req.body.password)) {
      res.status(403).send('Invalid password');
    } else {
      res.cookie('user_id', getUserID(req.body.email));
    }
  }
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const userID = generateRandomString();

  if (!req.body.email || !req.body.password) { // check if email or password is empty
    console.log('EMAIL OR PASSWORD MISSING')
    res.status(400).send('Email or password missing');
  } else if (checkEmail(req.body.email)) { // check if email already exists in users database
    console.log('DUPLICATE EMAIL')
    res.status(400).send('Email already exists');
  } else { // add new user to users database
    console.log('NEW USER ADDED')
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
  };
  console.log(users); // view users object after

  res.cookie('user_id', userID);
  res.redirect('/urls');
});