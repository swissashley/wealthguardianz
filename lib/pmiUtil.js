const fetch = require('node-fetch');

exports.fetchPmi = function (pmiUrl) {
    return new Promise(function (resolve) {
        fetch(pmiUrl)
            .then(function(res) {
                return res.text();
            })
            .then(function(data) {
                console.log('fetched pmi');
                pmiData = JSON.parse(data).dataset.data;
                resolve(pmiData);
            });
    });
};

exports.fetchBP = function (buildPermitUrl) {
    return new Promise(function (resolve) {
        fetch(buildPermitUrl)
            .then(function(res) {
                return res.text();
            })
            .then(function(data) {
                bpData = JSON.parse(data).observations;
                resolve(bpData);
            });
    });
};

exports.fetchStock = function (stockUrl) {
    return new Promise(function (resolve) {
        fetch(stockUrl)
            .then(function(res) {
                return res.text();
            })
            .then(function(data) {
                stockData = JSON.parse(data)["Monthly Time Series"];
                resolve(stockData);
            });
    });
};

exports.slicePmiData = function(pmiData, startYear, endYear) {
    pmiData = pmiData.filter(function(el) {
        return parseInt(el[0].split("-")[0]) >= startYear && parseInt(el[0].split("-")[0]) <= endYear;
    }).reverse();
    pmiData = pmiData.slice(1);
    return pmiData;
};

exports.calculatePmiData = function(pmiData, startYear, endYear) {
    var data = [];
    for(var i = 1; i < pmiData.length; i++) {
        var calculation = pmiData[i][1] - pmiData[i-1][1];
        if (calculation > 0 & pmiData[i][1] > 50) {
            data.push(1);
        } else if (calculation > 0 & pmiData[i][1] < 50) {
            data.push(0.5);
        } else if (calculation < 0 & pmiData[i][1] > 50) {
            data.push(-0.5);
        } else if (calculation < 0 & pmiData[i][1] < 50) {
            data.push(-1);
        } else {
            data.push(0);
        }
    }
    console.log('calculating pmi');
    return data;
};

var simple_moving_averager = function (period) {
    var nums = [];
    return function(num) {
        nums.push(num);
        if (nums.length > period) {
            nums.splice(0,1);  // remove the first element of the array
        }
        var sum = 0;
        for (var i in nums) {
            sum += nums[i];
        }
        var n = period;
        if (nums.length < period)
        {
            n = nums.length;
        }
        return(sum/n);
    }
};

exports.sliceBpData = function(bpData, startYear, endYear) {
    bpData = bpData.filter(function(el) {
        return parseInt(el.date.split("-")[0]) >= startYear && parseInt(el.date.split("-")[0]) <= endYear;
    });
    delete bpData[0].realtime_start;
    delete bpData[0].realtime_end;

    for(var i = 1; i < bpData.length; i++) {
        delete bpData[i].realtime_start;
        delete bpData[i].realtime_end;
    }
    return bpData;
};

exports.calculateBpData = function(bpData, startYear, endYear) {
    var data = [];
    var sma = simple_moving_averager(5);
    for(var i = 1; i < bpData.length; i++) {
        var movingAvg = sma(i);
        var calculation = (parseInt(bpData[i].value) - movingAvg) / parseInt(movingAvg);
        data.push(calculation);
    }
    console.log('calculating bp');
    return data;
};

exports.sliceStockData = function (stockData, startYear, endYear) {
    var stockDataArr = [];
    for (var k in stockData) {
        if (k.split("-")[0] >= startYear && k.split("-")[0] <= endYear) {
            var value = parseFloat(stockData[k]["4. close"]);
            var date = k;
            stockDataArr.push([date, value]);
        }
    }
    stockDataArr.reverse();
    stockData = stockDataArr.slice(0, stockDataArr.length - 1);
    console.log('calculating stock');
    return stockData;
};

exports.buyOrSell = function(pmiData, bpData, stockData, calculationData, startYear, endYear, allowExtraCash, startingFund, cash, extraCash, shares, actions) {
    var perfData = [];
    for(var i = 5; i < pmiData.length; i++) {
        var action = "";
        if (calculationData.pmi[i] = 1 & pmiData[i][1] > 50) {
            action = calculationData.bp[i] > 0 ? actions[0] : actions[1];
            var cashToPurchase = startingFund * action;
            var purchasedShares = Math.floor(cashToPurchase / stockData[i][1]);
            if (cash - purchasedShares * stockData[i][1] < 0) {
                if (allowExtraCash) {
                    var diffShares = purchasedShares - Math.floor(cash / stockData[i][1]);
                    diffShares = diffShares > 2 ? 2 : diffShares;
                    purchasedShares = diffShares + Math.floor(cash / stockData[i][1]);
                    cash += diffShares  * stockData[i][1];
                    extraCash += diffShares  * stockData[i][1];
                    startingFund += diffShares  * stockData[i][1];
                } else {
                    purchasedShares = Math.floor(cash / stockData[i][1]);
                }
            }
            cash -= purchasedShares * stockData[i][1];
            shares += purchasedShares;
            action = "Buy " + purchasedShares + " Shares";
        } else if (calculationData.pmi[i] = 0.5 & pmiData[i][1] < 50) {
            action = calculationData.bp[i-1] > 0 ? actions[1] : actions[2];
            var cashToPurchase = startingFund * action;
            var purchasedShares = Math.floor(cashToPurchase / stockData[i][1]);
            if (cash - purchasedShares * stockData[i][1] < 0) {
                if (allowExtraCash) {
                    var diffShares = purchasedShares - Math.floor(cash / stockData[i][1]);
                    diffShares = diffShares > 2 ? 2 : diffShares;
                    purchasedShares = diffShares + Math.floor(cash / stockData[i][1]);
                    cash += diffShares  * stockData[i][1];
                    extraCash += diffShares  * stockData[i][1];
                    startingFund += diffShares  * stockData[i][1];
                } else {
                    purchasedShares = Math.floor(cash / stockData[i][1]);
                }
            }
            cash -= purchasedShares * stockData[i][1];
            shares += purchasedShares;
            action = "Buy " + purchasedShares + " Shares";
        } else if (calculationData.pmi[i] = -0.5 & pmiData[i][1] > 50) {
            action = calculationData.bp[i-1] > 0 ? actions[3] : actions[4];
            var cashToSell = startingFund * action;
            var sellShares = Math.floor(cashToSell / stockData[i][1]);
            if (shares < sellShares) {
                sellShares = shares;
            }
            cash += sellShares * stockData[i][1];
            shares -= sellShares;
            action = "Sell " + sellShares + " Shares";
        } else if (calculationData.pmi[i] = -1 & pmiData[i][1] < 50) {
            action = calculationData.bp[i-1] > 0 ? actions[4] : actions[5];
            var cashToSell = startingFund * action;
            var sellShares = Math.floor(cashToSell / stockData[i][1]);
            if (shares < sellShares) {
                sellShares = shares;
            }
            cash += sellShares * stockData[i][1];
            shares -= sellShares;
            action = "Sell " + sellShares + " Shares";
        }
        var stockValue = shares * stockData[i][1];
        var totalValue = stockValue + cash;
        var earning = totalValue - startingFund;
        var performance = totalValue / startingFund;
        perfData.push({
            pmiDate: pmiData[i][0],
            pmiData: pmiData[i][1],
            bpDate: bpData[i].date,
            bpData: bpData[i].value,
            stockDate: stockData[i][0],
            stockData: stockData[i][1],
            action: action,
            cash: cash,
            extraCash: extraCash,
            shares: shares,
            stockPrice: stockData[i][1],
            stockValue: stockValue,
            totalValue: totalValue,
            cost: startingFund,
            earning: earning,
            performance: performance,
        });
    }
    console.log('calculating perf');
    return perfData;
};