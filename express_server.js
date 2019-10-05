const express = require('express');
const methodOverride = require('method-override');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  signed: false
}));
// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

 // templating engine
app.set('view engine', 'ejs');

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
  // not logged in (i.e. cookie empty)
  if (!req.session.userId) {
    res.render('login', { user: null, msg: 'Please login to view URLs.' });

  } else {
    res.render('urls_index', { urls: getUrls(req.session.userId, urlDatabase), user: users[req.session.userId], msg: false });

  }
});

// load 'Create New URL' page
app.get('/urls/new', (req, res) => {
  // not logged in
  if (!req.session.userId) {
    res.render('login', { user: null, msg: 'Please login to create a shortURL' });

  // logged in
  } else {
    res.render('urls_new', { user: users[req.session.userId], msg: false });

  }
});

// load page showing results of newly added longURL and the corresponding shortURL (with the option to edit)
app.get('/urls/:shortURL', (req, res) => {
  // if not logged in, then alert
  if (!req.session.userId) {
    res.render('login', { user: null, dateCreated: null, msg: 'Please log in to view the requested url.' });
  
    // if the :shortURL is not in the database, return an appropriate alert message
  } else if (!checkUrl(req.params.shortURL, urlDatabase)) {
    res.render('urls_show', { user: users[req.session.userId], longURL: null, shortURL: null, dateCreated: null, 
      msg: 'The requested short URL does not exist in our database. Please try with a different short URL.' });

    // if the urls does not belong to :shortURL, then alert
  } else if (urlDatabase[req.params.shortURL] && urlDatabase[req.params.shortURL].userID !== req.session.userId) {
    res.render('urls_show', { user: users[req.session.userId], longURL: null, shortURL: null, analytics: null, 
      msg: 'The requested short URL does not belong to you. Please try with a different short URL or log in with a different user.' });
  
  } else {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.userId],
      analytics: urlDatabase[req.params.shortURL].analytics,
      msg: false
    };
    res.render('urls_show', templateVars);
  }

});

// load page based on shortURL
app.get('/u/:shortURL', (req, res) => {
  // alert if the shortURL does not exist in the database
  if (!checkUrl(req.params.shortURL, urlDatabase)) {
    
    // if the user is logged in, redirect them to the My URLs page to view the valid short URLs
    if (req.session.userId) {
      res.render('urls_index', { urls: getUrls(req.session.userId, urlDatabase), user: users[req.session.userId], 
        msg: 'The requested short URL does not exist in our database. Please check the list again.' });
    
    // if the user is NOT logged in, redirect them to the login page
    } else {
      res.render('login', { user: users[req.session.userId], longURL: null, shortURL: null,
        msg: 'The requested short URL does not exist in our database. Please login to view the list of valid short URLs.' });
    }

  // redirect to corresponding website if the shortURL exists in the database
  } else {
    //////////// Unique Visitors ////////////
    // generate a trackingID for the visitor
    let trackingID = generateRandomString();
    // check if trackingID is in the urlDatabase
    if (urlDatabase[req.params.shortURL].visitors.length !== 0 && !urlDatabase[req.params.shortURL].visitors.includes(trackingID)) {
      // NEW VISITOR! add trackingID to session cookie
      res.session = { trackingID: generateRandomString() };
      urlDatabase[req.params.shortURL].analytics.numUniqueVisitor += 1;
    } 
    // increment visit counter (even duplicate visitors count!)
    urlDatabase[req.params.shortURL].analytics.numVisitor += 1;
    
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL); // must be http://www...to work

  }
});

// load login page
app.get('/login', (req, res) => {
  // not logged in
  if (!req.session.userId) {
    res.render('login', { user: null, msg: false });
  
  // logged in
  } else {
    res.redirect('/urls');
  }
});

// load registration page
app.get('/register', (req, res) => {
  if (!req.session.userId) { // not logged in
    res.render('register', { user: null, msg: false });

  // logged in
  } else {
    res.redirect('/urls');
  }
});

// loading the logout page will clear cookies and redirect to 'My URLs' page
app.get('/logout', (req, res) => {
  // destroy session
  req.session = null;
  // redirect to login page
  res.redirect('/login');
});

/////////////////// POST /////////////////////
// add new URLs to database
app.post('/urls', (req, res) => {
  // create timestamp along with new shortURL (initialize visitor counts too)
  urlDatabase[generateRandomString()] = {
    longURL: req.body.longURL,
    userID: req.session.userId,
    analytics: { created: new Date(), numVisitor: 0, numUniqueVisitor: 0 }
  };
  let keys = Object.keys(urlDatabase);
  res.redirect(`/urls/${keys[keys.length - 1]}`);
});

// edit the longURL of an existing shortURL
app.put('/urls/:id', (req, res) => {
  // if not logged in, then alert
  if (!req.session.userId) {
    res.status(401).send('UNAUTHORIZED: NOT LOGGED IN');

  // user logged in
  } else {
    // check if url belongs to the user
    if (urlDatabase[req.params.id] && urlDatabase[req.params.id].userID !== req.session.userId) {
      res.status(401).send('UNAUTHORIZED: NOT YOUR URL');

    } else {
      // update database with newURL
      if (urlDatabase[req.params.id]) {
        urlDatabase[req.params.id].longURL = req.body.newURL;
        res.redirect('/urls');

      } else {
        res.status(405).send('METHOD NOT ALLOWED: SHORT URL NOT IN DATABASE');
      }

    }
  }
});

// delete entry on My URLs page (button)
app.delete('/urls/:shortURL', (req, res) => {
  // if not logged in, then alert
  if (!req.session.userId) {
    res.status(401).send('UNAUTHORIZED: NOT LOGGED IN');

  // logged in
  } else {
    
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
  // if email cannot be found, return 403
  if (!checkEmail(req.body.email, users)) {
    res.status(403).render('login', { user: null, msg: 'Invalid email.' });
    // res.status(403).send('Invalid email');

  // if password is invalid, return 403
  } else {
    if (!checkPassword(req.body.password, users)) {
      res.status(403).render('login', { user: null, msg: 'Invalid password.' });
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

  // check if email or password is empty
  if (!req.body.email || !req.body.password) {
    res.status(400).render('register', { user: null, msg: 'Email or password is empty.' });
    // res.status(400).send('Email or password missing');

  // check if email already exists in users database
  } else if (checkEmail(req.body.email, users)) {
    res.status(400).render('register', { user: null, msg: 'Account already exists.' });
    // res.status(400).send('Email already exists');
  
  // add new user to users database
  } else {
    // hash password before storage
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10) 
    };
    // set session cookie for newly registered user
    req.session = { userId: userID };
  }
  // redirect to My URLs page after successful registration
  res.redirect('/urls');
});