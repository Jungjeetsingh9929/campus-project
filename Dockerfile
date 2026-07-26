FROM node:24-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=/api
ARG VITE_ENABLE_LIVE_API=true
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ENABLE_LIVE_API=$VITE_ENABLE_LIVE_API
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
ENV PORT=10000
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 10000
CMD ["nginx", "-g", "daemon off;"]
