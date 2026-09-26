# Build stage: install with the pinned pnpm and build through Nx, as in local development.
FROM node:24-alpine AS build
RUN npm install -g pnpm@11.13.1
WORKDIR /workspace
ENV NX_DAEMON=false CI=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm nx build frontend

# Runtime stage: Nginx serves the static build and proxies /api to the backend container.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html
EXPOSE 80
