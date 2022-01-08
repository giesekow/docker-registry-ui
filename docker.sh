#!/bin/bash

repo=giesekow/docker-registry-ui
tag=1.0.0

if [ -z $2 ]
then
  echo "tag not provided using $tag"
else
  tag=$2
fi

if [ $1 = "build" ]
then
  filter="${repo}-*:${tag}"
  docker build -f Dockerfile -t ${repo}:${tag} .
fi

if [ $1 = "clean" ]
then
  filter="${repo}:${tag}"
  docker rmi -f $(docker images --filter=reference="$filter" -q)
fi

if [ $1 = "push" ]
then
  docker login
  docker push ${repo}:${tag}
fi