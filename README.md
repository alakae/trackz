# trackz

[![Built with Devbox](https://www.jetify.com/img/devbox/shield_galaxy.svg)](https://www.jetify.com/devbox/docs/contributor-quickstart/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> Graphical arrival and departure board for railway stations in Switzerland.

This is a just for fun project.

## Using

The latest image is automatically deployed at [trackz.ch](http://trackz.ch).

## Developing

To execute the app in the development mode either run

```
devbox run -- npm ci
devbox run -- npm run dev
```

The page will reload if you make edits. You will also see any lint errors in the console.

### sbx

Inside an sbx sandbox, the dev server isn't reachable from the host until its port is
published:

```
sbx ports <sandbox-name> --publish 5173:5173/tcp
```

Vite's `--host 0.0.0.0` only binds IPv4, but the published port also forwards IPv6
(`::1`). If the host resolves `localhost` to `::1` first, the connection reaches the
sandbox with nothing listening on IPv6 and gets dropped. Bind Vite dual-stack instead:

```
devbox run -- npm run dev -- --host :: --port 5173
```

## CI dry run

To replicate the [pull request checks](.github/workflows/pull-request-checks.yml) locally, run the following commands in sequence:

```
devbox run -- npm ci
devbox run -- npm run build
devbox run -- npm run lint
devbox run -- npm run format:check
```
