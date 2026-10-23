# Etapa 1: Build
FROM node:22-alpine AS build
RUN apk upgrade --no-cache
WORKDIR /app

RUN npm config set registry https://registry.npmjs.org/

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Producción
FROM nginx:alpine
RUN apk upgrade --no-cache
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
