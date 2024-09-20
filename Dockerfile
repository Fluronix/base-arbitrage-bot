FROM node:18-alpine

WORKDIR /base-arbitrage-bot

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install -g typescript

RUN tsc

CMD [ "node", "src/main.js" ]