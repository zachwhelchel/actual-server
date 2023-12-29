FROM node:16-bullseye as base
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
ADD .yarn ./.yarn
ADD yarn.lock package.json .yarnrc.yml ./

ARG REACT_APP_BILLING_STATUS
ENV REACT_APP_BILLING_STATUS=$REACT_APP_BILLING_STATUS

ARG REACT_APP_TRIAL_END_DATE
ENV REACT_APP_TRIAL_END_DATE=$REACT_APP_TRIAL_END_DATE

ARG REACT_APP_ZOOM_RATE
ENV REACT_APP_ZOOM_RATE=$REACT_APP_ZOOM_RATE

ARG REACT_APP_ZOOM_LINK
ENV REACT_APP_ZOOM_LINK=$REACT_APP_ZOOM_LINK

ARG REACT_APP_COACH
ENV REACT_APP_COACH=$REACT_APP_COACH

ARG REACT_APP_COACH_FIRST_NAME
ENV REACT_APP_COACH_FIRST_NAME=$REACT_APP_COACH_FIRST_NAME

ARG REACT_APP_USER_FIRST_NAME
ENV REACT_APP_USER_FIRST_NAME=$REACT_APP_USER_FIRST_NAME

RUN yarn workspaces focus --all --production

FROM node:16-bullseye-slim as prod
RUN apt-get update && apt-get install tini && apt-get clean -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=base /app/node_modules /app/node_modules
ADD package.json app.js ./
ADD src ./src
ENTRYPOINT ["/usr/bin/tini","-g",  "--"]
EXPOSE 5006
CMD ["node", "app.js"]
