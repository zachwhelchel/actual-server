FROM node:18-bullseye as base
RUN apt-get update && apt-get install -y openssl
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

ARG REACT_APP_COACH=kristinwade
ENV REACT_APP_COACH=$REACT_APP_COACH

ARG REACT_APP_COACH_FIRST_NAME
ENV REACT_APP_COACH_FIRST_NAME=$REACT_APP_COACH_FIRST_NAME

ARG REACT_APP_USER_FIRST_NAME
ENV REACT_APP_USER_FIRST_NAME=$REACT_APP_USER_FIRST_NAME

RUN yarn workspaces focus --all --production

FROM node:18-bullseye-slim as prod
RUN apt-get update && apt-get install tini && apt-get clean -y && rm -rf /var/lib/apt/lists/*

ARG USERNAME=actual
ARG USER_UID=1001
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME
RUN mkdir /data && chown -R ${USERNAME}:${USERNAME} /data

WORKDIR /app
COPY --from=base /app/node_modules /app/node_modules
ADD package.json app.js ./
ADD src ./src
ADD migrations ./migrations
ENTRYPOINT ["/usr/bin/tini","-g",  "--"]
EXPOSE 5006
CMD ["node", "app.js"]
