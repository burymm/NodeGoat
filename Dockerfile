FROM node:20-alpine AS deps
ENV WORKDIR /usr/src/app/
WORKDIR $WORKDIR
COPY package*.json $WORKDIR
RUN npm install --no-cache

FROM node:20-alpine AS frontend-deps
ENV WORKDIR /usr/src/app/
WORKDIR $WORKDIR
COPY code-guardian/frontend/package*.json $WORKDIR
RUN npm install --no-cache

FROM node:20-alpine AS frontend-build
ENV WORKDIR /usr/src/app/
WORKDIR $WORKDIR
COPY code-guardian/frontend/ $WORKDIR
COPY --from=frontend-deps /usr/src/app/node_modules node_modules
RUN npm run build

FROM node:20-alpine
ENV USER node
ENV WORKDIR /home/$USER/app
ENV NODE_OPTIONS="--max-old-space-size=150"
RUN apk add --no-cache git curl \
    && curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin \
    && rm -rf /var/cache/apk/* \
    && trivy image --download-db-only --cache-dir /home/$USER/.cache/trivy 2>/dev/null || true
WORKDIR $WORKDIR
COPY --from=deps /usr/src/app/node_modules node_modules
COPY --from=frontend-build /usr/src/app/dist code-guardian/frontend/dist
RUN chown $USER:$USER $WORKDIR
COPY --chown=node . $WORKDIR
RUN npx tsc -p code-guardian
USER $USER
EXPOSE 4000
