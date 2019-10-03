const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
// const cookieParser = require('cookie-parser');
// app.use(cookieParser());
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set('view engine', 'ejs'); // templating engine

// import data
const { urlDatabase } = require('./data/db');
const { users } = require('./data/db');

// import helper functions
const { getUserByEmail } = require('./helpers');
const { generateRandomString } = require('./helpers');
const { checkEmail } = require('./helpers');
const { checkPassword } = require('./helpers');
const { getUrls } = require('./helpers');

/////////////////// GET //////////////////////
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
  if (!req.session.user_id) { // not logged in (i.e. cookie empty)
    let templateVars = {
      user: null,
      msg: 'Please login to continue',
      status: false
    };
    res.render('login', templateVars);
  } else {
    let templateVars = { 
      urls: getUrls(req.session.user_id, urlDatabase),
      user: users[req.session.user_id]
     };
     res.render('urls_index', templateVars);
    }
});

// load 'Create New URL' page
app.get('/urls/new', (req, res) => { // GET route to show the form
  console.log('user NOT logged in?', !req.session.user_id);
  if (!req.session.user_id) { // not logged in
    let templateVars = {
      user: null,
      msg: 'Please login to create a shortURL',
      status: false
    };
    res.render('login', templateVars); //

  } else { // logged in
    templateVars = {
      user: users[req.session.user_id]
    };
    res.render('urls_new', templateVars);
  }
});

// load page showing results of newly added longURL and the corresponding shortURL (with the option to edit)
app.get('/urls/:shortURL', (req, res) => {
  if (!req.session.user_id) { // if not logged in, then alert
    let templateVars = {
      user: null,
      msg: 'Please log in to view the newly added url',
      status: false
    };
    res.render('login', templateVars);

  } else if (!getUrls(req.session.user_id, urlDatabase)) { // if the urls does not belong to :id, then alert
    let templateVars = {
      user: null,
      longURL: null,
      shortURL: null,
      msg: 'This URL does not belong to you. Please log in with a different user',
      status: false
    };
    res.render('urls_show', templateVars);

  } else {
    let templateVars = { 
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.user_id],
      status: true
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
  if (!req.session.user_id) { // not logged in
    templateVars = {
      user: null,
      status: true   
    };
    res.render('login', templateVars);
  } else { // logged in
    res.redirect('/urls');
  }
});

// load login_alert page
// app.get('/login_alert', (req, res) => {
//   res.render('login_alert');
// });

// load registration page
app.get('/register', (req, res) => {
  if (!req.session.user_id) { // not logged in
    templateVars = {
      user: null,
      status: true
    };
    res.render('register', templateVars);
  } else { // logged in
    res.redirect('/urls');
  }
});

// loading the logout page will clear cookies and redirect to 'My URLs' page
app.get('/logout', (req, res) => {
  req.session = null; // destroy session
  res.redirect('/login');
});

/////////////////// POST /////////////////////
// add new URLs to database
app.post('/urls', (req, res) => {
  console.log('NewURL being added', req.body.longURL); // Log the POST request body to the console
  urlDatabase[generateRandomString()] = { // update urlDatabase with newly generated short URL, along with longURL and userID
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  let keys = Object.keys(urlDatabase);
  res.redirect(`/urls/${keys[keys.length - 1]}`);
});

// delete entry on My URLs page (button)
app.post('/urls/:shortURL/delete', (req, res) => {
  // if not logged in, then alert
  if (!req.session.user_id) {
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
  if (!req.session.user_id) {
    console.log('EDIT DENIED')
    let templateVars = {
      user: null,
      msg: 'Please login to edit',
      status: false
    };
    res.render('login', templateVars);

  } else {
    console.log('EDIT SUCCESS'); 
    urlDatabase[req.params.id] = req.body.newURL; // update database with newURL
    res.redirect('/urls');
  }
});

// check login credentials
app.post('/login', (req, res) => {
  if (!checkEmail(req.body.email, users)) { // if email cannot be found, return 403
    let templateVars = {
      user: null,
      msg: 'Invalid email',
      status: false
    }
    res.status(403).render('login', templateVars);
    // res.status(403).send('Invalid email');

  } else { // if password is invalid, return 403
    if (!checkPassword(req.body.password, users)) {
      let templateVars = {
        user: null,
        msg: 'Invalid password',
        status: false
      }
      res.status(403).render('login', templateVars);
      // res.status(403).send('Invalid password');

    } else {
      req.session.user_id = getUserByEmail(req.body.email, users);

    }
  }
  res.redirect('/urls');
});

// register a user
app.post('/register', (req, res) => {
  const userID = generateRandomString();

  if (!req.body.email || !req.body.password) { // check if email or password is empty
    console.log('EMAIL OR PASSWORD MISSING');
    let templateVars = {
      user: null,
      msg: 'Email or password is EMPTY',
      status: false
    };
    res.status(400).render('register', templateVars);
    // res.status(400).send('Email or password missing');

  } else if (checkEmail(req.body.email)) { // check if email already exists in users database
    console.log('DUPLICATE EMAIL');
    let templateVars = {
      user: null,
      msg: 'Duplicate email',
      status: false
    };
    res.status(400).render('register', templateVars)
    // res.status(400).send('Email already exists');

  } else { // add new user to users database
    console.log('NEW USER ADDED');
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10) // hash password before storage
    };
  };
  console.log(users); // view users object after

  res.cookie('user_id', userID);
  res.redirect('/urls');
});