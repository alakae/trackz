# trackz

[![Build Status](https://travis-ci.org/alakae/trackz.svg?branch=master)](https://travis-ci.org/alakae/trackz)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> Graphical arrival and departue board for railway stations in Switzerland.

This is a just for fun project. I am using it to teach myself technologies such as [React](https://github.com/facebook/react), [React Konva](https://github.com/konvajs/react-konva), Docker, docker-compose, continous deployment to Kubernetes, etc.


## Using

The latest image is automatically deployed at [trackz.ch](http://trackz.ch).

## Developing

To execute the app in the development mode either run
```
docker-compose up
```
or
```
cd web
npm run start
```
The app will be available at [http://localhost:8080](http://localhost:8080)
or [http://localhost:3000](http://localhost:3000) respectively.

The page will reload if you make edits. You will also see any lint errors in the console.
