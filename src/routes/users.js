var express = require('express');
const ash = require('express-async-handler');
var router = express.Router();
const auth = require('../authentication')

/* GET users listing. */
router.get('/', auth.isAdmin, ash(async function(req, res, next) {
  const db = req.app.get('db');
  const users = await db.users.find({ isAdmin: { $ne: true } });
  res.render('users/userlist', { users });
}));

router.get('/create', auth.isAdmin, function(req, res, next) {
  res.render('users/create', { message: '' });
});

router.post('/create', auth.isAdmin, ash(async function(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;
  const reppasswd = req.body.repeatPassword;
  if (password === "" || username === "") return res.render('users/create', { message: 'Password and username required!' });
  if (password !== reppasswd) return res.render('users/create', { message: 'Passwords do not match!' });
  const user = { username, password, isAdmin: false };
  const newUser = await auth.createUser(req.app, user);
  res.redirect('/users');
}));

router.get('/edit/:userId', auth.isAdmin, ash(async function(req, res, next) {
  const db = req.app.get('db');
  const userId = req.params.userId;
  const user = await db.users.findOne({ _id: userId })
  if (user) return res.render('users/edit', { message: user.username, user });
  else res.redirect('/users')
}));

router.post('/edit/:userId', auth.isAdmin, ash(async function(req, res, next) {
  const db = req.app.get('db');
  const userId = req.params.userId;
  const user = await db.users.findOne({ _id: userId })
  const username = req.body.username;
  const password = req.body.password;
  const reppasswd = req.body.repeatPassword;

  if (password === "" || username === "") return res.render('users/edit', { message: 'Password and username required!', user });
  if (password !== reppasswd) return res.render('users/edit', { message: 'Passwords do not match!', user });

  const euser = { username, password, isAdmin: user.isAdmin };
  await auth.editUser(req.app, userId, euser);
  res.redirect('/users');
}));

router.get('/remove/:userId', auth.isAdmin, ash(async function(req, res, next) {
  const db = req.app.get('db');
  const userId = req.params.userId;
  await db.users.remove({ _id: userId })
  res.redirect('/users');
}));

router.get('/profile', ash(async function(req, res, next) {
  const user = req.session.user;
  console.log(user);
  if (user) {
    return res.render('users/edit', { message: user.username, user, isProfile: true });
  } else {
    return res.redirect('/')
  }
}));

router.post('/profile', ash(async function(req, res, next) {
  const user = req.session.user
  const username = req.body.username;
  const password = req.body.password;
  const reppasswd = req.body.repeatPassword;

  if (password === "" || username === "") return res.render('users/edit', { message: 'Password and username required!', user });
  if (password !== reppasswd) return res.render('users/edit', { message: 'Passwords do not match!', user });

  const euser = { username, password, isAdmin: user.isAdmin };
  await auth.editUser(req.app, user._id, euser);
  res.redirect('/');
}));

module.exports = router;
