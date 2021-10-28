FROM frolvlad/alpine-glibc:alpine-3.11_glibc-2.31
WORKDIR /app
RUN apk update && apk add curl libstdc++ upx
RUN curl -fsSL https://deno.land/x/install/install.sh | sh -s v1.9.2
RUN ls -al /root
COPY server /app
RUN /root/.deno/bin/deno compile -A --unstable --lite --no-check index.mjs
# RUN upx /app/app
