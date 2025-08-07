FROM archlinux
WORKDIR /app
RUN pacman -Syu --noconfirm
RUN pacman -S --needed --noconfirm base-devel curl nodejs unzip node-gyp python 
RUN curl -fsSL https://bun.sh/install | bash
COPY package.json bun.lock* ./
RUN /home/root/.bun/bin/bun i --frozen-lockfile
COPY . .
CMD ["/home/root/.bun/bin/bun", "run", "start"]