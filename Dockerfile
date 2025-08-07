FROM oven/bun:latest
COPY package.json bun.lock* ./
RUN bun i --frozen-lockfile
COPY . .
CMD ["bun", "run", "start"]