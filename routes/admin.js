const express = require('express');
const User = require('../models/User');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/users', async(req, res, next) => {
    try {
        const users = await User.find();
        res.render('manage-users', {users});
       
    }catch(error){
        next(error);
    }
});

router.get('/user/:id', async(req, res, next) => {
    try {
        const {id} = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
        req.flash('error', 'Invalid id');
        res.redirect('/admin/users');
        return;
    }
    const person = await User.findById(id);
    res.render('profile', {person});
    }catch(error){
        next(error);
    }
});

router.post('/update-role', async(req, res, next)=> {
    const {id, role} = req.body;

    if(!id || !role){
        req.flash('error', 'Invalid request');
        return res.redirect('/admin/users');
    }

    if(!mongoose.Types.ObjectId.isValid(id)){
        req.flash('error', 'Invalid id');
        return res.redirect('/admin/users');
    }
});

module.exports = router;