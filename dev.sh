#!/bin/bash
set -o allexport; source .env; set +o allexport
nvm use 14
DEBUG=docker-registry-ui:* node ./src/bin/www