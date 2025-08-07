FROM archlinux
RUN pacman -Syu
RUN pacman -S curl nodejs unzip python
RUN curl -fsSL https://bun.sh/install | bash
RUN bun i
CMD ["bun", "run", "start"]