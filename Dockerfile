FROM node:8.16
RUN apt-get update
RUN npm install -g bower
RUN npm install gulp-cli -g
RUN apt-get install -y yarn
RUN apt-get install -y graphicsmagick
RUN apt-get install -y ruby-full
RUN gem update --system && gem install compass

#WORKDIR usr/src/app

#COPY package*.json ./
#COPY bower.json ./

#RUN npm install
#RUN bower install --allow-root

#COPY . .