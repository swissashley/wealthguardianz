FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm cache clean --force && npm install

# Bundle app source
COPY . /usr/src/app
RUN npm run build

EXPOSE 3456

CMD NODE_ENV=${DEVELOPMENT_ENV} PMI_URL="https://www.quandl.com/api/v3/datasets/ISM/MAN_PMI.json?api_key=5JUKtbM1Bhav5SkxxgVi" BP_URL="https://api.stlouisfed.org/fred/series/observations?series_id=permit&api_key=28b258c3a67318c468a8084a33a920cc&file_type=json" QQQ_URL="https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=qqq&apikey=NX2U43YZSQBHK6IG&datatype=json" PORT=3456 node server.js
