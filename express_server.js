const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
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
const { checkUrl } = require('./helpers');

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
  if (!req.session.userId) { // not logged in (i.e. cookie empty)
    let templateVars = {
      user: null,
      msg: 'Please login to view URLs.',
      status: false
    };
    res.render('login', templateVars);

  } else {
    let templateVars = {
      urls: getUrls(req.session.userId, urlDatabase),
      user: users[req.session.userId],
      status: true
    };
    res.render('urls_index', templateVars);
  }
});

// load 'Create New URL' page
app.get('/urls/new', (req, res) => { // GET route to show the form
  if (!req.session.userId) { // not logged in
    let templateVars = {
      user: null,
      msg: 'Please login to create a shortURL',
      status: false
    };
    res.render('login', templateVars); //

  } else { // logged in
    let templateVars = {
      user: users[req.session.userId]
    };
    res.render('urls_new', templateVars);
  }
});

// load page showing results of newly added longURL and the corresponding shortURL (with the option to edit)
app.get('/urls/:shortURL', (req, res) => {
  // if not logged in, then alert
  if (!req.session.userId) {
    let templateVars = {
      user: null,
      msg: 'Please log in to view the requested url.',
      status: false
    };
    res.render('login', templateVars);
  
    // if the :shortURL is not in the database, return an appropriate alert message
  } else if (!checkUrl(req.params.shortURL, urlDatabase)) {
    let templateVars = {
      user: users[req.session.userId],
      longURL: null,
      shortURL: null,
      msg: 'The requested short URL does not exist in our database. Please try with a different short URL.',
      status: false
    };
    res.render('urls_show', templateVars);

    // if the urls does not belong to :shortURL, then alert
  } else if (urlDatabase[req.params.shortURL] && urlDatabase[req.params.shortURL].userID !== req.session.userId) {
    let templateVars = {
      user: users[req.session.userId],
      longURL: null,
      shortURL: null,
      msg: 'The requested short URL does not belong to you. Please try with a different short URL or log in with a different user.',
      status: false
    };
    res.render('urls_show', templateVars);
  
  } else {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.userId],
      status: true
    };
    res.render('urls_show', templateVars);
  }

});

// load page corresponding to the shortURL that the user inputs
app.get('/u/:shortURL', (req, res) => {
  // alert if the shortURL does not exist in the database
  if (!checkUrl(req.params.shortURL, urlDatabase)) {
    
    // if the user is logged in, redirect them to the My URLs page to view the valid short URLs
    if (req.session.userId) {
      let templateVars = {
        urls: getUrls(req.session.userId, urlDatabase),
        user: users[req.session.userId],
        msg: 'The requested short URL does not exist in our database. Please check the list again.',
        status: false
      };
      res.render('urls_index', templateVars);
    
    // if the user is NOT logged in, redirect them to the login page
    } else {
      let templateVars = {
        user: users[req.session.userId],
        longURL: null,
        shortURL: null,
        msg: 'The requested short URL does not exist in our database. Please login to view the list of valid short URLs.',
        status: false
      };
      res.render('login', templateVars);
    }

  // redirect to corresponding website if the shortURL exists in the database
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL); // must be http://www...

  }
});

// load login page
app.get('/login', (req, res) => {
  // only show login page if they're not logged in
  // if they're logged in --> redirect to /urls page
  if (!req.session.userId) { // not logged in
    let templateVars = {
      user: null,
      status: true
    };
    res.render('login', templateVars);
  } else { // logged in
    res.redirect('/urls');
  }
});

// load registration page
app.get('/register', (req, res) => {
  if (!req.session.userId) { // not logged in
    let templateVars = {
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
  urlDatabase[generateRandomString()] = { // update urlDatabase with newly generated short URL, along with longURL and userID
    longURL: req.body.longURL,
    userID: req.session.userId
  };
  let keys = Object.keys(urlDatabase);
  res.redirect(`/urls/${keys[keys.length - 1]}`);
});

// receive newURL from user for specific shortURL (:id)
app.post('/urls/:id', (req, res) => {
  // if not logged in, then alert
  if (!req.session.userId) { // test with curl or postman
    res.status(401).send('UNAUTHORIZED: NOT LOGGED IN');

  } else { // user logged in
    // check if url belongs to the user
    if (urlDatabase[req.params.id] && urlDatabase[req.params.id].userID !== req.session.userId) { // test with curl or postman
      res.status(401).send('UNAUTHORIZED: NOT YOUR URL');

    } else {
      if (urlDatabase[req.params.id]) {
        // update database with newURL
        urlDatabase[req.params.id].longURL = req.body.newURL;
        res.redirect('/urls');

      } else { // test with curl or postman
        res.status(405).send('METHOD NOT ALLOWED: SHORT URL NOT IN DATABASE');
      }

    }
  }
});

// delete entry on My URLs page (button)
app.post('/urls/:shortURL/delete', (req, res) => {
  // if not logged in, then alert
  if (!req.session.userId) {
    res.status(401).send('UNAUTHORIZED: NOT LOGGED IN');

  } else { // logged in
    
    // check if user owns the URL
    if (urlDatabase[req.params.shortURL] && urlDatabase[req.params.shortURL].userID !== req.session.userId) {
      res.status(401).send('UNAUTHORIZED: NOT YOUR URL');
      
    } else {
      if (urlDatabase[req.params.shortURL]) {
        delete urlDatabase[req.params.shortURL];
        res.redirect('/urls');

      } else {
        res.status(405).send('METHOD NOT ALLOWED: SHORT URL NOT IN DATABASE');

      }
    }
  }
});

// check login credentials
app.post('/login', (req, res) => {
  if (!checkEmail(req.body.email, users)) { // if email cannot be found, return 403
    let templateVars = {
      user: null,
      msg: 'Invalid email.',
      status: false
    };
    res.status(403).render('login', templateVars);
    // res.status(403).send('Invalid email');

  } else { // if password is invalid, return 403
    if (!checkPassword(req.body.password, users)) {
      let templateVars = {
        user: null,
        msg: 'Invalid password.',
        status: false
      };
      res.status(403).render('login', templateVars);
      // res.status(403).send('Invalid password');

    } else {
      req.session.userId = getUserByEmail(req.body.email, users);

    }
  }
  res.redirect('/urls');
});

// register a user
app.post('/register', (req, res) => {
  const userID = generateRandomString();

  if (!req.body.email || !req.body.password) { // check if email or password is empty
    let templateVars = {
      user: null,
      msg: 'Email or password is empty.',
      status: false
    };
    res.status(400).render('register', templateVars);
    // res.status(400).send('Email or password missing');

  } else if (checkEmail(req.body.email, users)) { // check if email already exists in users database
    let templateVars = {
      user: null,
      msg: 'Account already exists.',
      status: false
    };
    res.status(400).render('register', templateVars);
    // res.status(400).send('Email already exists');

  } else { // add new user to users database
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10) // hash password before storage
    };
    req.session = { userId: userID }; // set session for newly registered user
  }
  res.redirect('/urls');
});