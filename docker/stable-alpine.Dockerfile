FROM alpine:3.17 as base
RUN apk add --no-cache nodejs yarn npm python3 openssl build-base
WORKDIR /app
ADD .yarn ./.yarn
ADD yarn.lock package.json .yarnrc.yml ./
RUN if [ "$(uname -m)" = "armv7l" ]; then yarn config set taskPoolConcurrency 2; yarn config set networkConcurrency 5; fi

ARG REACT_APP_BILLING_STATUS
ENV REACT_APP_BILLING_STATUS=$REACT_APP_BILLING_STATUS

ARG REACT_APP_TRIAL_END_DATE
ENV REACT_APP_TRIAL_END_DATE=$REACT_APP_TRIAL_END_DATE

ARG REACT_APP_ZOOM_RATE
ENV REACT_APP_ZOOM_RATE=$REACT_APP_ZOOM_RATE

ARG REACT_APP_ZOOM_LINK
ENV REACT_APP_ZOOM_LINK=$REACT_APP_ZOOM_LINK

ARG REACT_APP_CHAT_USER_ID
ENV REACT_APP_CHAT_USER_ID=$REACT_APP_CHAT_USER_ID

ARG REACT_APP_CHAT_SECRET
ENV REACT_APP_CHAT_SECRET=$REACT_APP_CHAT_SECRET

ARG REACT_APP_COACH=kristinwade
ENV REACT_APP_COACH=$REACT_APP_COACH

ARG REACT_APP_COACH_FIRST_NAME
ENV REACT_APP_COACH_FIRST_NAME=$REACT_APP_COACH_FIRST_NAME

ARG REACT_APP_USER_FIRST_NAME
ENV REACT_APP_USER_FIRST_NAME=$REACT_APP_USER_FIRST_NAME

ARG REACT_APP_USER_EMAIL
ENV REACT_APP_USER_EMAIL=$REACT_APP_USER_EMAIL

RUN yarn workspaces focus --all --production
RUN if [ "$(uname -m)" = "armv7l" ]; then npm install bcrypt better-sqlite3 --build-from-source; fi

FROM alpine:3.17 as prod
RUN apk add --no-cache nodejs tini

ARG USERNAME=actual
ARG USER_UID=1001
ARG USER_GID=$USER_UID
RUN addgroup -S ${USERNAME} -g ${USER_GID} && adduser -S ${USERNAME} -G ${USERNAME} -u ${USER_UID}
RUN mkdir /data && chown -R ${USERNAME}:${USERNAME} /data

WORKDIR /app
COPY --from=base /app/node_modules /app/node_modules
ADD package.json app.js ./
ADD src ./src
ADD migrations ./migrations
ENTRYPOINT ["/sbin/tini","-g",  "--"]
EXPOSE 5006
CMD ["node", "app.js"]
