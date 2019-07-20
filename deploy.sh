docker build -t alakae/multi-web:latest -t alakae/multi-web:$SHA -f ./web/Dockerfile ./web

docker push alakae/multi-web:latest

docker push alakae/multi-web:$SHA