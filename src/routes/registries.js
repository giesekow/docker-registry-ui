var express = require('express');
const ash = require('express-async-handler');
var router = express.Router();
const auth = require('../authentication')

/* GET users listing. */
router.get('/', ash(async function(req, res, next) {
  const userId = req.session.user._id;
  const db = req.app.get('db');
  const items = await db.registries.find({ userId });
  res.render('registries/list', { items });
}));

router.get('/create', function(req, res, next) {
  res.render('registries/create', { message: '' });
});

router.post('/create', ash(async function(req, res, next) {
  const name = req.body.name;
  let hasAuth = req.body.hasAuth || "";
  let showEmpty = req.body.showEmpty || "";
  const username = req.body.username;
  const password = req.body.password;
  const baseURL = req.body.baseURL;
  const userId = req.session.user._id;

  hasAuth = ["yes", "on", "true"].includes(hasAuth.toString().toLowerCase());
  showEmpty = ["yes", "on", "true"].includes(showEmpty.toString().toLowerCase());

  if (!name) res.render('registries/create', { message: 'Name required!' });
  if (!baseURL) res.render('registries/create', { message: 'Base URL required!' });
  if (hasAuth && (!username || !password)) return res.render('registries/create', { message: 'username of password required!' });

  const repo = { userId, baseURL, hasAuth, name, showEmpty };
  if (hasAuth) {
    const authString = (Buffer.from(`${username}:${password}`)).toString('base64')
    repo.authorization = authString;
  }

  const db = req.app.get('db');
  await db.registries.insert(repo);
  res.redirect('/registries');
}));

router.get('/edit/:regId', ash(async function(req, res, next) {
  const db = req.app.get('db');
  const userId = req.session.user._id;
  const regId = req.params.regId;
  const registry = await db.registries.findOne({ userId, _id: regId })
  if (registry) {
    return res.render('registries/edit', { message: registry.username, registry });
  } else res.redirect('/registries')
}));

router.post('/edit/:regId', ash(async function(req, res, next) {
  const name = req.body.name;
  let hasAuth = req.body.hasAuth || "";
  let showEmpty = req.body.showEmpty || "";
  const username = req.body.username;
  const password = req.body.password;
  const baseURL = req.body.baseURL;
  const userId = req.session.user._id;
  console.log(hasAuth)
  hasAuth = ["yes", "on", "true"].includes(hasAuth.toString().toLowerCase());
  showEmpty = ["yes", "on", "true"].includes(showEmpty.toString().toLowerCase());

  const db = req.app.get('db');
  const regId = req.params.regId;
  const registry = await db.registries.findOne({ userId, _id: regId })
  if (!registry) return res.render('registries/edit', { message: 'Registry does not exist in our database!', registry });

  if (!name) res.render('registries/edit', { message: 'Name required!' });
  if (!baseURL) res.render('registries/edit', { message: 'Base URL required!' });
  if (hasAuth && (!username || !password)) return res.render('registries/create', { message: 'username of password required!' });

  const repo = { userId, baseURL, hasAuth, showEmpty, name };
  if (hasAuth) {
    const authString = (Buffer.from(`${username}:${password}`)).toString('base64')
    repo.authorization = authString;
  }

  await db.registries.update({ userId, _id: regId }, repo);
  res.redirect('/registries');

}));

router.get('/remove/:regId', ash(async function(req, res, next) {
  const db = req.app.get('db');
  const userId = req.session.user._id;
  const regId = req.params.regId;
  await db.users.remove({ _id: regId, userId });
  res.redirect('/registries');
}));

router.get('/view/:regId', ash(async function(req, res, next) {
  const db = req.app.get('db');
  const userId = req.session.user._id;
  const regId = req.params.regId;
  const registry = await db.registries.findOne({ userId, _id: regId })
  if (registry) {
    req.session.registry = registry._id;
    res.redirect('/repos');
  } else {
    res.redirect('/registries');
  }
}));

module.exports = router;
