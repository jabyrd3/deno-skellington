# this is a tiny skeleton for a deno api server

## build
```
docker build -t deno-build:latest --progress=plain -f builder.dockerfile . \
&& docker build -t deno-skellington:latest --progress=plain .
```

## run
```
docker run --init -p 8080:8080 deno-skellington:latest
```

## dev
install deno like this:
```
curl -fsSL https://deno.land/x/install/install.sh | sh -s v1.9.2
```
then
```
deno run --unstable --watch -A --no-check server/index.mjs
```
gives you live-dev with the ts type checking off
