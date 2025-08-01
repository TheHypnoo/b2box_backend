FROM node:23 as builder

WORKDIR /app/medusa

COPY . .

RUN rm -rf node_modules

RUN apt-get update && apt-get install -y python3 python3-pip python-is-python3

RUN yarn install --loglevel=error

RUN yarn run build


FROM node:23

# Bug https://github.com/coollabsio/coolify/issues/1930
ARG COOKIE_SECRET
ARG JWT_SECRET
ARG STORE_CORS
ARG ADMIN_CORS
ARG AUTH_CORS
ARG DISABLE_ADMIN
ARG WORKER_MODE
ARG PORT
ARG DATABASE_URL
ARG REDIS_URL
ARG BACKEND_URL
ARG S3_FILE_URL
ARG S3_ACCESS_KEY_ID
ARG S3_SECRET_ACCESS_KEY
ARG S3_REGION
ARG S3_BUCKET
ARG S3_ENDPOINT
ARG S3_FORCE_PATH_STYLE
ARG SHOPIFY_STORE_DOMAIN
ARG SHOPIFY_ADMIN_TOKEN
ARG STRIPE_API_KEY
ARG TWILIO_ACCOUNT_SID
ARG TWILIO_AUTH_TOKEN
ARG TWILIO_SERVICE_SID

RUN echo "${PORT}"

WORKDIR /app/medusa

RUN mkdir .medusa

# COPY package*.json .yarnrc.yml yarn.lock ./

COPY medusa-config.ts .
# COPY tsconfig.json .

RUN apt-get update && apt-get install -y python3 python3-pip python-is-python3

COPY --from=builder /app/medusa/.medusa ./.medusa

WORKDIR /app/medusa/.medusa/server

RUN yarn install --production


# RUN medusa migrations run
COPY migrations.sh /app/medusa/.medusa/server/migrations.sh
RUN chmod +x /app/medusa/.medusa/server/migrations.sh
RUN /app/medusa/.medusa/server/migrations.sh

RUN rm /app/medusa/.medusa/server/migrations.sh

CMD ["yarn", "run", "start"]