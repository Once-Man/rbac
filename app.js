const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const session = require('express-session');
const connectFlash = require('connect-flash');
const passport = require('passport');
const mongoSessionStore = require("connect-mongo");

const app = express();
require('./utils/passport')(passport);
app.use(morgan('dev'));

app.use(express.urlencoded({extended: false}));
app.use(express.json());

const MongoStore = mongoSessionStore(session);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        // secure: true
        httpOnly: true,
    },
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        ttl: 14 * 24 * 60 * 60 // save session for 14 days
      }),
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next)=> {
    res.locals.user = req.user;
    next();
});

app.use(connectFlash());

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI;

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, ('public'))));

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/user',ensureAuthenticated, require('./routes/user'));
app.use('/admin', ensureAdmin, require('./routes/admin'));

app.use((req, res, next)=> {
    next(createHttpError.NotFound());
});

app.use((error, req, res, next) => {
    error.status = error.status || 500;
    res.status(error.status);
    res.render('error_40x', {error});
    res.send(error);
})

mongoose.connect(DB_URI, {useNewUrlParser: true,useUnifiedTopology: true})
        .then(()=> console.log('DB is connected...'))
        .catch((error)=> console.log(error))
        
app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});
function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()){
        next();
    }else{
         res.redirect('/auth/login');
    }
}

function ensureAdmin(req, res, next) {
    if(req.user.role === 'Admin'){
        next();
    }else{
        req.flash('warning', 'you are not authorized!');
        res.redirect('/');
    }
}