FROM node

RUN mkdir -p /monitor
WORKDIR /monitor
COPY . /monitor

RUN npm install

VOLUME /monitor

EXPOSE 3000
ENTRYPOINT ["npm", "start"]