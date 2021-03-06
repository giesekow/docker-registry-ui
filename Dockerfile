FROM node:14-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./src/package*.json ./

RUN yarn

# Bundle app source
COPY ./src/. .

CMD [ "sh", "entrypoint.sh"]
