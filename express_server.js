const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.set('view engine', 'ejs'); // templating engine

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
  'test01': {
    id: 'test01',
    email: 'test@test',
    password: 'test'
  }
}; // initialize empty users object

const generateRandomString = function() { // generate 6-digit random alphanumeric string
  return Math.random().toString(36).substr(2, 6);
};

const checkEmail = function(email) {
  for (user in users) {
    if (users[user].email === email) {
      return true;
    }
  };
  return false; 
};

const getUserID = function(email) { // retrieve userID from email
  for (user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  };
  return null; // no matching user
};

const checkPassword = function(password) {
  for (user in users) {
    if (users[user].password === password) {
      return true;
    }
  };
  return false;
};
//////////////////////////////////////////////
//////////////////////////////////////////////
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

app.get('/urls', (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
   };
  // console.log(templateVars);
  res.render('urls_index', templateVars);
});


app.get('/urls/new', (req, res) => { // GET route to show the form
  console.log(!users[req.cookies['user_id']]);
  if (!users[req.cookies['user_id']]) { // not logged in
    res.redirect('/login'); // redirect to login page if not logged in
  } else { // logged in
    templateVars = {
      user: users[req.cookies['user_id']]
    };
    res.render('urls_new', templateVars);
  }
});


app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']]
  };
  res.render('urls_show', templateVars);
});

app.post('/urls', (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  urlDatabase[generateRandomString()] = req.body.longURL; // update urlDatabase with newly generated short URL, along with longURL
  let keys = Object.keys(urlDatabase);
  res.redirect(`/urls/${keys[keys.length - 1]}`);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  console.log(`ShortURL ${req.params.shortURL} has been deleted`);
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  console.log(req.body); // receive newURL from user for specific shortURL (:id)
  urlDatabase[req.params.id] = req.body.newURL; // update database with newURL
  res.redirect('/urls');
});

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

app.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
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