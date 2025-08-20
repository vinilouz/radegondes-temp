FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodeuser -u 1001

COPY package.json ./
RUN npm install --production && npm cache clean --force

COPY . .

USER nodeuser

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]