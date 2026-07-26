FROM node:24-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=/api
ARG VITE_ENABLE_LIVE_API=true
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ENABLE_LIVE_API=$VITE_ENABLE_LIVE_API
COPY package.json ./
RUN corepack enable && pnpm install
COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
