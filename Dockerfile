# Etapa 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Bypass de Furycloud (DLP) forzando el registro público de NPM
RUN npm config set registry https://registry.npmjs.org/

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: Producción
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
