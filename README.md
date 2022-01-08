# A Frontend UI for private docker registry.
This UI is design to be a standalone service and can work with multiple docker registries.

Just add your registries after login and start accessing and managing your repositories.

## Docker Image
`docker run -p 8080:8080 giesekow/docker-registry-ui`

Access the ui at `http://localhost:8080`

You can mount the database at `/db` by default in the container to persist the registry and user information.
