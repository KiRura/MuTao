FROM oven/bun:latest
RUN apt update
RUN apt upgrade -y
RUN apt install python3 node-gyp -y
COPY package.json bun.lock* ./
RUN bun i --frozen-lockfile
COPY . .
CMD ["bun", "run", "start"]