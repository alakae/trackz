docker build -t alakae/trackz:latest -t alakae/trackz:$SHA -f ./web/Dockerfile ./web

docker push alakae/trackz:latest

docker push alakae/trackz:$SHA