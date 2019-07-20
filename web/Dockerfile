FROM node:lts-alpine AS builder
WORKDIR /app

COPY ./package.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx
WORKDIR /etc/nginx/conf.d
COPY ./default.conf .

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/build .
