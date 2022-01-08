var express = require('express');
const ash = require('express-async-handler');
var router = express.Router();
const auth = require('../authentication');
const docker = require('./docker');

/* GET users listing. */
router.get('/', ash(async function(req, res, next) {
  const userId = req.session.user._id;
  const regId = req.session.registry;
  if (!regId) return res.redirect('/registries')

  const db = req.app.get('db');
  const registry = await db.registries.findOne({ userId, _id: regId });
  if (!registry) return res.redirect('/registries')
  const items = await docker.getRepos(registry)
  res.render('repos/list', { items, registry });
}));

router.get('/:repo/tags', ash(async function(req, res, next) {
  const userId = req.session.user._id;
  const regId = req.session.registry;
  const repo = req.params.repo;
  if (!regId) return res.redirect('/registries')

  const db = req.app.get('db');
  const registry = await db.registries.findOne({ userId, _id: regId });
  if (!registry) return res.redirect('/registries')

  const items = await docker.getTags(registry, repo)
  res.render('repos/tags', { items, registry, repository: repo });
}));

router.get('/remove/:repo', ash(async function(req, res, next) {
  const userId = req.session.user._id;
  const regId = req.session.registry;
  const repo = req.params.repo;

  if (!regId) return res.redirect('/registries')

  const db = req.app.get('db');
  const registry = await db.registries.findOne({ userId, _id: regId });

  if (!registry) return res.redirect('/registries')

  await docker.removeRepo(registry, repo)
  res.redirect(`/repos`);
}));

router.get('/:repo/tags/:tag/remove', ash(async function(req, res, next) {
  const userId = req.session.user._id;
  const regId = req.session.registry;
  const repo = req.params.repo;
  const tag = req.params.tag;

  if (!regId) return res.redirect('/registries')

  const db = req.app.get('db');
  const registry = await db.registries.findOne({ userId, _id: regId });

  if (!registry) return res.redirect('/registries')

  await docker.removeRepoTag(registry, repo, tag)
  res.redirect(`/repos/${encodeURIComponent(repo)}/tags`);
}));

module.exports = router;
