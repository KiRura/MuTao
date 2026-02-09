FROM node:24-alpine

RUN apk update
RUN apk install curl wget pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm i --frozen-lockfile

COPY . .

CMD ["pnpm", "run", "start"]
