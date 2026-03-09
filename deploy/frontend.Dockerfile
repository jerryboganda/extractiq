# ─── Frontend static file server ───
FROM node:20-alpine AS builder

# Build Website
WORKDIR /build/website
COPY ["Website/package.json", "Website/package-lock.json", "./"]
RUN npm ci
COPY ["Website/", "."]
RUN npm run build

# Build Web App
WORKDIR /build/webapp
COPY ["Web App/package.json", "Web App/package-lock.json", "./"]
RUN npm ci
COPY ["Web App/", "."]
ENV VITE_API_URL=/api/v1
RUN npm run build

# ─── Serve with nginx ───
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /build/website/dist /usr/share/nginx/html/website
COPY --from=builder /build/webapp/dist /usr/share/nginx/html/webapp

COPY deploy/frontend-nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
