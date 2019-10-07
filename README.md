# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly). 'Minor' requirements have been satisfied and tested using Postman / curl (setting cookie sessions when necessary).

## Final Product

#### Register
!["Register page"](https://github.com/jimhjkim/tinyapp/blob/master/docs/register-page.png?raw=true)

#### Login
!["Login page"](https://github.com/jimhjkim/tinyapp/blob/master/docs/login-page.png?raw=true)

#### My URLs
!["My URLs page"](https://github.com/jimhjkim/tinyapp/blob/master/docs/urls-page.png?raw=true)

#### Create New URL
!["Create URL page"](https://github.com/jimhjkim/tinyapp/blob/master/docs/urlsNew-page.png?raw=true)

#### Show New Short URL (option to edit)
!["View New Short URL"](https://github.com/jimhjkim/tinyapp/blob/master/docs/urlsShow-analytics-page.png?raw=true)

#### Error Handling (Visible)
##### Registraton error - empty email or password
!["Register: empty email or password"](https://github.com/jimhjkim/tinyapp/blob/master/docs/register-emptyEmailOrPassword-page.png?raw=true)
##### Registration error - email (user) already exists
!["Register: email already exists"](https://github.com/jimhjkim/tinyapp/blob/master/docs/register-AccountAlreadyExists-page.png?raw=true)
##### Not logged in error - trying to access My URLs
!["Not logged in: access My URLs"](https://github.com/jimhjkim/tinyapp/blob/master/docs/urls-loginRedirect-page.png?raw=true)
##### Not logged in error - trying to access Create New URL
!["Not logged in: access Create New URL"](https://github.com/jimhjkim/tinyapp/blob/master/docs/urlsNew-loginRedirect-page.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.
