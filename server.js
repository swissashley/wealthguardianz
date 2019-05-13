const express = require('express');

const next = require('next');
const dev = process.env.NODE_ENV === 'development';
const PORT = process.env.PORT ? process.env.PORT : 3456;
const app = next({dev});
const handle = app.getRequestHandler();
const pmiUtil = require('./lib/pmiUtil');

app.prepare()
    .then(function() {
        const server = express();
        server.use(function(req, res, next) {
            next();
        });

        server.get('/pmi/:symbol/:start/:end', (req, res) => {
            const actualPage = "/pmi";
            const queryParams = {
            symbol: req.params.symbol,
            start: req.params.start,
            end: req.params.end
            };
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            app.render(req, res, actualPage, queryParams);
        })

        server.get('/api/pmi', function(req, res) {

            var symbol = req.query.symbol;
            var startYear = req.query.start;
            var endYear = req.query.end;

            var allowExtraCash = false;
            var startingFund = 30000;
            var cash = 30000;
            var extraCash = 0;
            var shares = 0;
            var actions = [0.26, 0.02, 0.01, 0.005, 0.010, 0.15];

            var pmiData;
            var bpData;
            var stockData;

            var pmiUrl = "https://www.quandl.com/api/v3/datasets/ISM/MAN_PMI.json?api_key=5JUKtbM1Bhav5SkxxgVi";
            var buildPermitUrl = "https://api.stlouisfed.org/fred/series/observations?series_id=permit&api_key=28b258c3a67318c468a8084a33a920cc&file_type=json";
            var stockUrl = "https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=" + symbol + "&apikey=NX2U43YZSQBHK6IG&datatype=json";
            var calculationData = {pmi: [], bp: [], perf: []};

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.setHeader('Content-Type', 'application/json');
            Promise.all([
                pmiUtil.fetchPmi(pmiUrl),
                pmiUtil.fetchBP(buildPermitUrl),
                pmiUtil.fetchStock(stockUrl)
            ]).then(function (data) {
                pmiData = data[0];
                bpData = data[1];
                stockData = data[2];

                // Process PMI
                pmiData = pmiUtil.slicePmiData(pmiData, startYear, endYear);
                calculationData.pmi = pmiUtil.calculatePmiData(pmiData, startYear, endYear);

                // Process Building permits
                bpData = pmiUtil.sliceBpData(bpData, startYear, endYear);
                calculationData.bp = pmiUtil.calculateBpData(bpData, startYear, endYear);

                // Process Stock
                stockData = pmiUtil.sliceStockData(stockData, startYear, endYear);

                // Execise!!
                calculationData.perf = pmiUtil.buyOrSell(pmiData, bpData, stockData, calculationData, startYear, endYear, allowExtraCash, startingFund, cash, extraCash, shares, actions);
                res.send({symbol: symbol, pmi: pmiData, bp: bpData, stock: stockData, performance: calculationData.perf});
            });
        });

        server.get('*', function(req, res) {
            return handle(req, res);
        });

        server.listen(PORT, function(err) {
            if (err) {
                throw err;
            }
            console.log('> Ready on http://localhost:' + PORT);
        });
    })
    .catch((ex) => {
        console.error(ex.stack)
        process.exit(1)
    })