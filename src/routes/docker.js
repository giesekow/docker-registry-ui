const axios = require('axios')

const urlDict = {
  catalog: '/v2/_catalog',
  tags: '/v2/{repo}/tags/list',
  manifest: '/v2/{repo}/manifests/{tag}',
  delete: '/v2/{repo}/manifests/{sha}'
}

const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

function parseURL(baseURL, path, repo, tag, sha) {
  let p = urlDict[path]

  if (repo) p = p.replace('{repo}', encodeURIComponent(repo))
  if (tag) p = p.replace('{tag}', encodeURIComponent(tag))
  if (sha) p = p.replace('{sha}', sha)

  const url = new URL(p, baseURL)
  return url.href;
}

async function getRepos(registry) {
  const headers = {}
  const baseURL = registry.baseURL;
  const showEmpty = registry.showEmpty;
  const auth = registry.hasAuth ? `Basic ${registry.authorization}` : null;
  if (auth) {
    headers['Authorization'] = auth
  }
  const res = await axios.get(parseURL(baseURL, 'catalog'), { headers })
  const data = res.data.repositories || [];
  const items = [];
  for (let i = 0; i < data.length; i++) {
    if (!showEmpty) {
      const tags = await getTagCount(registry, data[i]);
      if (tags > 0) {
        items.push({
          name: data[i],
          tags
        })
      }
    } else {
      items.push({
        name: data[i],
        tags: 'N/A'
      })
    }
  }
  return items;
}

async function getTagCount(registry, repo) {
  const headers = {}
  const baseURL = registry.baseURL;
  const auth = registry.hasAuth ? `Basic ${registry.authorization}` : null;
  if (auth) {
    headers['Authorization'] = auth
  }
  const res = await axios.get(parseURL(baseURL, 'tags', repo), { headers })
  const tags = res.data.tags || [];
  let count = 0;
  for (let i = 0; i < tags.length; i++) {
    try {
      const hasTag = await verifyTag(registry, repo, tags[i]);
      if (hasTag) count += 1;
    } catch (error) {}
  }

  return count;
}

async function verifyTag(registry, repo, tag) {
  const headers = { Accept: 'application/vnd.docker.distribution.manifest.v2.1+json', 'Content-Type': 'application/json' }
  const baseURL = registry.baseURL;
  const auth = registry.hasAuth ? `Basic ${registry.authorization}` : null;
  if (auth) {
    headers['Authorization'] = auth
  }
  try {
    await axios.head(parseURL(baseURL, 'manifest', repo, tag), { headers })
    return true
  } catch (error) {
    return false;
  }
}

async function getTags(registry, repo) {
  const headers = {}
  const baseURL = registry.baseURL;
  const auth = registry.hasAuth ? `Basic ${registry.authorization}` : null;
  if (auth) {
    headers['Authorization'] = auth
  }
  const res = await axios.get(parseURL(baseURL, 'tags', repo), { headers })
  const tags = res.data.tags || [];
  const items = [];
  for (let i = 0; i < tags.length; i++) {
    const hasTag = await verifyTag(registry, repo, tags[i]);
    if (!hasTag) continue
    const data = await getShaInfo(registry, repo, tags[i])
    const item = { name: tags[i] }
    if (data.layers) {
      let size = data.layers.reduce((c, r) => { return c + Number(r.size || 0) }, 0);
      for (let s = 0; s < sizes.length; s++) {
        if (size < 1000 || s === sizes.length - 1) {
          size = `${Number(size).toFixed(2)}${sizes[s]}`
          break
        }
        size = size / 1024
      }
      item.size = size
    }
    if (data.config && data.config.digest) item.sha = data.sha;
    items.push(item);
  }
  return items;
}

async function getManifest(registry, repo, tag) {
  const headers = { Accept: 'application/vnd.docker.distribution.manifest.v2.1+json', 'Content-Type': 'application/json' }
  const baseURL = registry.baseURL;
  const auth = registry.hasAuth ? `Basic ${registry.authorization}` : null;
  if (auth) {
    headers['Authorization'] = auth
  }
  const res = await axios.get(parseURL(baseURL, 'manifest', repo, tag), { headers })
  return res.data || {};
}

async function getShaInfo(registry, repo, tag) {
  const headers = { Accept: 'application/vnd.docker.distribution.manifest.v2+json', 'Content-Type': 'application/json' }
  const baseURL = registry.baseURL;
  const auth = registry.hasAuth ? `Basic ${registry.authorization}` : null;
  if (auth) {
    headers['Authorization'] = auth
  }
  const res = await axios.get(parseURL(baseURL, 'manifest', repo, tag), { headers })
  return {...(res.data || {}), sha: res.headers['docker-content-digest'] };
}

async function removeRepo(registry, repo) {
  const tags = await getTags(registry, repo)
  for (let i = 0; i < tags.length; i++) {
    await removeRepoTag(registry, repo, tags[i].name);
  }
  return;
}

async function removeRepoTag(registry, repo, tag) {
  const data = await getShaInfo(registry, repo, tag);
  const baseURL = registry.baseURL;
  const sha = data.sha || null;
  const headers = { Accept: 'application/vnd.docker.distribution.manifest.v2+json' }
  const auth = registry.hasAuth ? `Basic ${registry.authorization}` : null;
  if (auth) {
    headers['Authorization'] = auth
  }
  if (sha) {
    try {
      const furl = parseURL(baseURL, 'delete', repo, null, sha)
      const res = await axios.delete(furl, { headers })
      return res.data || {};
    } catch (error) {
      throw error;
    }
  }
}

module.exports = {
  getRepos,
  getTags,
  removeRepoTag,
  removeRepo
}
