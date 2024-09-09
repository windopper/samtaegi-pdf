FROM node:18.18.0
WORKDIR /app
COPY src ./src
COPY .env.production .
COPY package.json .
COPY package-lock.json .
RUN npm install
CMD ["npm", "start"]
