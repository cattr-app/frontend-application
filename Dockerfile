FROM node:gallium AS frontend

COPY . /app

WORKDIR /app

ARG SENTRY_DSN
ARG APP_VERSION
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV APP_VERSION $APP_VERSION
ENV SENTRY_DSN $SENTRY_DSN
ENV IMAGE_VERSION=4.0.2

RUN yarn && \
    yarn compile && \
    yarn build

FROM nginx:alpine AS nginx

COPY --from=frontend /app/output /app
COPY cattr_server.conf /etc/nginx/conf.d/default.conf

WORKDIR /app

VOLUME /ssl
