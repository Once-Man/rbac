const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const passport = require('passport');
const {body, validationResult} = require('express-validator');
require('dotenv').config();

router.get('/login',ensureNotAuthenticated, async(req, res, next)=> {
    res.render('login');
});

router.get('/register',ensureNotAuthenticated, async(req, res, next)=> {
    res.render('register');
});

router.post('/login', (req, res, next)=> {
   try {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true,
})
(req, res, next);
   }  catch(error) {
    console.log(error.messages);
   }
});

router.post('/register',ensureNotAuthenticated,  [
    body('email').trim().isEmail().withMessage('Email must be a valid email').normalizeEmail().toLowerCase(),
    body('password').trim().isLength(6).withMessage('Password length short, min 6 character required'),
    body('password2').custom((value, {req}) => {
        if(value !== req.body.password){
            throw new Error ('Password do not match!')
        }
        return true;
    })
],async(req, res, next)=> {
    try {
         
        const email = req.body.email;
        const doesExist = await User.findOne({email: email});
        if(doesExist) {
            res.redirect('/auth/register');
            return;
        }
        // if(email == process.env.ADMIN_EMAIL.toLowerCase()){
        //     role = roles.admin;
        // }
            const password = req.body.password;
            const hashedPassword = await bcrypt.hash(password, 10);

            const errors = validationResult(req);
            if(!errors.isEmpty()){
              errors.array().forEach(error => {
                req.flash('error', error.msg);
              })
              res.render('register', {email: req.body.email,messages: req.flash()});
              return;
            }
            
            const userNew = await User({
                email: email,
                password: hashedPassword
                
            });
            const user = await userNew.save();
            req.flash('success', `${user.email} is successfully registered and you can login.`)
             res.redirect('/auth/login');
            
    }catch(error){
        next(error);
    }
});

router.get('/logout', async(req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

function ensureNotAuthenticated(req, res, next) {
    if(req.isAuthenticated()){
        res.redirect('back')
    }else{
         next();
    }
}


module.exports = router;