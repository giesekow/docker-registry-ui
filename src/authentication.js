var hashPsw = require('pbkdf2-password')();
var session = require('express-session');
const ash = require('express-async-handler');

async function authenticate(app, name, pass) {
  const db = app.get('db')
  const user = await db.users.findOne({ username: name })
  if (!user) throw new Error('Login error, username or password error!');
  const { hash } = await hashPassword(pass, user.salt);
  if (hash === user.hash) {
    delete user.salt;
    delete user.hash;
    return user;
  }
  throw new Error('Login error, username or password error!');
}

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    if (salt) {
      hashPsw({ password, salt }, function(err, pass, salt, hash) {
        if (err) reject(err);
        else resolve({ salt, hash })
      });
    } else {
      hashPsw({ password }, function(err, pass, salt, hash) {
        if (err) reject(err);
        else resolve({ salt, hash })
      });
    }
  })
}

async function createAdmin(app) {
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPswd = process.env.ADMIN_PSWD || 'admin';
  if (adminUser && adminPswd) {
    const db = app.get('db');
    const admin = await db.users.findOne({ username: adminUser });
    if (admin) {
      console.log(`Admin account ${adminUser}, already exists! patching accounts`);
      await db.users.update({}, { $set: { isAdmin: false } });
      await db.users.update({ _id: admin._id }, { $set: { isAdmin: true } })
    } else {
      const { salt, hash } = await hashPassword(adminPswd);
      const user = { salt, hash, username: adminUser, isAdmin: true }
      await db.users.update({}, { $set: { isAdmin: false } })
      await db.users.insert(user);
      console.log(`Admin account ${adminUser}, successfully created!`);
    }
  }
}

async function createUser(app, user) {
  const db = app.get('db');
  const euser = await db.users.findOne({ username: user.username });
  if (euser) throw new Error(`There exist a user with username ${user.username}`);
  const { hash, salt } = await hashPassword(user.password);
  delete user.password;
  user.hash = hash;
  user.salt = salt;
  const newUser = await db.users.insert(user);
  return newUser
}

async function editUser(app, id, user) {
  const db = app.get('db');
  const euser = await db.users.findOne({ username: user.username, _id: { $ne: id } });
  if (euser) throw new Error(`There exist a user with username ${user.username}`);
  const { hash, salt } = await hashPassword(user.password);
  delete user.password;
  user.hash = hash;
  user.salt = salt;
  await db.users.update({ _id: id }, user);
  return user;
}

function middleware(req, res, next) {
  res.locals.currentUser = req.session.user;
  next();
}

function configure(app) {

  app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'shhhh, very secret'
  }));

  createAdmin(app);

  app.get('/logout', function(req, res) {
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function() {
      res.redirect('/');
    });
  });

  app.get('/login', function(req, res) {
    res.render('login', { message: "" });
  });

  app.post('/login', ash(async function(req, res) {
    try {
      const user = await authenticate(app, req.body.username, req.body.password);
      req.session.regenerate(function() {
        // Store the user's primary key
        // in the session store to be retrieved,
        // or in this case the entire user object
        req.session.user = user;
        res.redirect('/');
      });
    } catch (error) {
      req.session.user = null;
      res.render('login', { message: error.message });
    }

  }));

  app.post('/register', isAdmin, ash(async function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const reppasswd = req.body.repeatPassword
    if (password !== reppasswd) return res.render('users/create', { message: 'passwords do not match' });
    if (password === "") return res.render('users/create', { message: 'password required' });

    const { salt, hash } = await hashPassword(adminPswd)
    const user = { salt, hash, username, isAdmin: false }

    try {
      createUser(app, user)
      res.redirect('/users')
    } catch (error) {
      return res.render('users/create', { message: error.message });
    }

  }));
}

module.exports = {
  configure,
  restrict,
  isAdmin,
  createUser,
  createAdmin,
  hashPassword,
  editUser,
  middleware
}
