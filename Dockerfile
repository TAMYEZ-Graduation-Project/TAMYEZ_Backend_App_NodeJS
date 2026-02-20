FROM node:22.22.0 AS base
WORKDIR /TAMYEZ_APP
COPY package.json .
COPY tsconfig.json .


FROM base AS dev
RUN npm i
COPY . .
CMD [ "npm", "run", "start:dev_docker" ]

FROM base AS prod
RUN npm install pm2 -g
RUN npm i --only=production
COPY . .
CMD [ "npm", "run", "start:prod_docker" ]