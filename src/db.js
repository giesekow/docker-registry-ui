var Datastore = require('nedb');
var path = require('path');

const filepath = process.env.DB_PATH || '/db'
const dbpaths = {
  users: 'users.db',
  registries: 'registries.db'
}

class Collection {

  constructor(options) {
    this.coll = new Datastore(options)
  }

  find(query, projection) {
    return new Promise((resolve, reject) => {
      this.coll.find(query, projection, (err, docs) => {
        if (err) reject(err)
        else resolve(docs)
      })
    })
  }

  collection() {
    return this.coll;
  }

  find(query) {
    return new Promise((resolve, reject) => {
      this.coll.find(query, (err, docs) => {
        if (err) reject(err)
        else resolve(docs)
      })
    })
  }

  findOne(query) {
    return new Promise((resolve, reject) => {
      this.coll.findOne(query, (err, doc) => {
        if (err) reject(err)
        else resolve(doc)
      })
    })
  }

  remove(query, options) {
    return new Promise((resolve, reject) => {
      this.coll.remove(query, options, (err, count) => {
        if (err) reject(err)
        else resolve(count)
      })
    })
  }

  remove(query) {
    return new Promise((resolve, reject) => {
      this.coll.remove(query, {}, (err, count) => {
        if (err) reject(err)
        else resolve(count)
      })
    })
  }

  update(query, data, options) {
    return new Promise((resolve, reject) => {
      this.coll.update(query, data, options, (err, count) => {
        if (err) reject(err)
        else resolve(count)
      })
    })
  }

  update(query, data) {
    return new Promise((resolve, reject) => {
      this.coll.update(query, data, {}, (err, count) => {
        if (err) reject(err)
        else resolve(count)
      })
    })
  }

  insert(document) {
    return new Promise((resolve, reject) => {
      this.coll.insert(document, (err, doc) => {
        if (err) reject(err)
        else resolve(doc)
      })
    })
  }

  loadDatabase() {
    return new Promise((resolve, reject) => {
      this.coll.loadDatabase((err) => {
        if (err) reject(err);
        else resolve();
      })
    })
  }
}

module.exports = function(app) {
  const db = {};

  for (const k of Object.keys(dbpaths)) {
    db[k] = new Collection({ filename: path.join(filepath, dbpaths[k]), autoload: true })
  }

  app.set('db', db);
}
