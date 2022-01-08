function deleteRepo(repo) {
  if (confirm(`Delete all tags from ${repo} ?`)) {
    location.replace(`/repos/remove/${encodeURIComponent(repo)}`);
  }
}

function deleteRepoTag(repo, tag) {
  if (confirm(`Delete ${tag} from ${repo} ?`)) {
    location.replace(`/repos/${encodeURIComponent(repo)}/tags/${encodeURIComponent(tag)}/remove`);
  }
}

function onDeleteRepoClicked(event) {
  const repo = event.target.dataset.repo;
  if (repo) deleteRepo(repo);
}

function onDeleteRepoTagClicked(event) {
  const repo = event.target.dataset.repo;
  const tag = event.target.dataset.repoTag;
  if (repo) deleteRepoTag(repo, tag);
}

document.addEventListener("DOMContentLoaded", function(event) {
  let elements = document.getElementsByClassName('remove-repo-btn');
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener("click", onDeleteRepoClicked);
  }

  elements = document.getElementsByClassName('remove-tag-repo-btn');
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener("click", onDeleteRepoTagClicked);
  }
})
