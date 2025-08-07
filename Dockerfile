FROM archlinux
RUN pacman -Syu --noconfirm
RUN pacman -S curl nodejs unzip python --noconfirm
RUN curl -fsSL https://bun.sh/install | bash
RUN bun i
CMD ["bun", "run", "start"]