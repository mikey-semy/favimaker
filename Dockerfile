# syntax=docker/dockerfile:1.7

# ===== build stage =====
FROM node:22-alpine AS build
WORKDIR /app

# Yarn кэшируется отдельно — меняется package.json/yarn.lock → пересборка
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Собираем статический экспорт
COPY . .
RUN yarn build

# ===== serve stage =====
FROM nginx:1.27-alpine AS serve

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 3000
