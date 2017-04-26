FROM node:7.9
ADD dummy-server /var/app

WORKDIR /var/app

RUN npm install --production

EXPOSE 8000

CMD ["./server.js"]
