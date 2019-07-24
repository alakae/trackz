docker build -t alakae/trackz:latest -t alakae/trackz:$SHA -f ./web/Dockerfile ./web

docker push alakae/trackz:latest

docker push alakae/trackz:$SHA

kubectl apply -f k8s
kubectl set image deployments/web-deployment web=alakae/trackz:$SHA