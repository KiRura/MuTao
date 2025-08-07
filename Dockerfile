FROM archlinux
WORKDIR /app
RUN pacman -Syu --noconfirm
RUN pacman -S --needed --noconfirm base-devel curl nodejs unzip node-gyp python 
RUN curl -fsSL https://bun.sh/install | bash
COPY package.json bun.lock* ./
RUN ~/.bun/bin/bun i --frozen-lockfile
COPY . .
CMD ["~/.bun/bin/bun", "run", "start"]