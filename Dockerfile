FROM node:6

MAINTAINER 25th-floor GmbH "team@25th-floor.com"
EXPOSE "8080"

RUN apt-get update \
	&& apt-get install -y netcat \
	&& rm -rf /var/lib/apt/lists/*

RUN mkdir /app
WORKDIR /app

# Installing production dependencies
ADD ./package.json /app
RUN npm install

COPY . /app
COPY ./docker-entrypoint.sh /

ENV NODE_ENV production

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["ttrack-server"]
