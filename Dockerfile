FROM node:8.16
RUN apt-get update && \
    npm install -g \
        bower \
        gulp-cli && \
    apt-get install -y \ 
        yarn \
        graphicsmagick \
        ruby-full && \
    gem update --system && \
    gem install compass 
