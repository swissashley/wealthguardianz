import Layout from '../components/MyLayout.js';
import {Line, Doughnut, Bar} from "react-chartjs-2";
import _merge  from 'lodash/merge';
import React from 'react';
import AdSense from 'react-adsense';
import { withStyles } from '@material-ui/core/styles';
import Router, { withRouter } from 'next/router'
import withRoot from "../src/withRoot";
import {fetchPmi, fetchBP, fetchStock, slicePmiData, calculatePmiData, sliceBpData, calculateBpData, sliceStockData, buyOrSell} from '../lib/pmiUtil';
const styles = theme => ({
    button: {
        margin: theme.spacing.unit,
    },
    input: {
        display: 'none',
    },
});

export class Pmi extends React.Component {

    constructor(props) {
        super(props);
        const symbols = ['qqq', 'spy'];
        const symbolOptions = symbols.map((sym) =>
            (<option key={'symbol-option-' + sym} value={sym}>{sym}</option>)
        );
        this.state = {
            inClient: false,
            symbolOptions: symbolOptions
        };
        this.onSymbolDropdownChange = this.onSymbolDropdownChange.bind(this);
    }

    componentDidMount() {
        this.setState({ inClient: true });
    }

    componentDidUpdate(prevProps) {
        const { pathname, query } = this.props.router;
    }

    onSymbolDropdownChange(event) {
        var query = _merge(this.props.router.query, {symbol: event.target.value});
        var href = '/pmi/' + Object.keys(query).map((val) => (query[val])).join('/');
        Router.push(href);
    }

    static async getInitialProps({req}) {

        var symbol = req.params.symbol;
        var startYear = req.params.start;
        var endYear = req.params.end;

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
        pmiData = await fetchPmi(pmiUrl);
        bpData = await fetchBP(buildPermitUrl);
        stockData = await fetchStock(stockUrl);
        // Process PMI
        pmiData = slicePmiData(pmiData, startYear, endYear);
        calculationData.pmi = calculatePmiData(pmiData, startYear, endYear);

        // Process Building permits
        bpData = sliceBpData(bpData, startYear, endYear);
        calculationData.bp = calculateBpData(bpData, startYear, endYear);

        // Process Stock
        stockData = sliceStockData(stockData, startYear, endYear);

        // Execise!!
        calculationData.perf = buyOrSell(pmiData, bpData, stockData, calculationData, startYear, endYear, allowExtraCash, startingFund, cash, extraCash, shares, actions);
        var pmiDate = [];
        var pmi = [];
        var bp = [];
        var stock = [];
        var totalValue = [];

        calculationData.perf.forEach(el => {
            pmiDate.push(el.pmiDate);
            pmi.push(el.pmiData);
            bp.push(el.bpData);
            stock.push(el.stockData);
            totalValue.push(el.performance * 100);
        });
        return {symbol: symbol, pmi: pmi, bp: bp, stock: stock, totalValue: totalValue, date: pmiDate, performance: calculationData.perf};
    }

    render() {
        let page;
        const {symbol, pmi, bp, stock, totalValue, date, performance, router} = this.props;
        let allData = {
            datasets: [
                {
                    label: 'pmi',
                    data: pmi,
                    backgroundColor: '#FF6384',
                    yAxisID: 'mainAxis',
                },
                {
                    label: 'building permit',
                    data: bp,
                    backgroundColor: '#ffd66f',
                    yAxisID: 'bpAxis'
                },
                {
                    label: symbol,
                    data: stock,
                    backgroundColor: '#be70ff',
                    type: 'line',
                    fill: false,
                    yAxisID: 'mainAxis'
                },
                {
                    label: 'Performance (100%)',
                    data: totalValue,
                    backgroundColor: '#1e7dff',
                    fill: false,
                    type: 'line',
                    yAxisID: 'mainAxis',
                }
            ],
            labels: date,
        };
        let options = {
            title: {
                display: true,
                text: "PMI, BP Stock Performance"
            },
            scales: {
                yAxes: [{
                    id: 'bpAxis',
                    type: 'linear',
                    position: 'right',
                    stacked: false,
                    // ticks: {
                    //     max: 2500,
                    //     min: 0
                    // }
                }, {
                    id: 'mainAxis',
                    type: 'linear',
                    position: 'left',
                    stacked: false,
                    // ticks: {
                    //     max: 1000,
                    //     min: 0
                    // }
                    // grid line settings
                    gridLines: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                }]
            }
        }


        if (this.state.inClient) {
            page = (
                <Layout>
                    <AdSense.Google
                        client='ca-pub-7292810486004926'
                        slot='7806394673'
                        style={{ display: 'block' }}
                        format='auto'
                        responsive='true'
                    />
                    <select className='symbol-dropdown' id='symboldropdown' value={symbol} onChange={this.onSymbolDropdownChange}>
                        {this.state.symbolOptions}
                    </select>
                    <Bar data={allData} options={options}/>
                </Layout>
            );
        } else {
            page = <span>  </span>;
        }
        return page;
    }
}

const mixData = {
    datasets: [
    {
        label: 'Bar Dataset',
        data: [10, 20, 30, 40],
        backgroundColor:
            '#FF6384'
        ,
        hoverBackgroundColor: [
            '#FF6384'
        ]
    }, {
        label: 'Bar Dataset2',
        data: [12, 22, 32, 45],
        backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#FF6384'
        ],
        hoverBackgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#FF6384'
        ]
    }, {
        label: 'Line Dataset',
        data: [50, 45, 35, 0],
        backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#FF6384'
        ],
        borderColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#FF6384'
        ],
        fill: false,
        // Changes this dataset to become a line
        type: 'line'
    }],
    labels: ['January', 'February', 'March', 'April']
};

const pieData = {
    labels: [
        'Red',
        'Green',
        'Yellow'
    ],
    datasets: [{
        data: [300, 50, 100],
        backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56'
        ],
        hoverBackgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56'
        ]
    }]
};

const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug','Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
        {
            label: 'Revenue',
            fill: false,
            backgroundColor: 'blue',
            borderColor: 'blue',
            pointBorderColor: 'blue',
            pointRadius: 1,
            data: [100, 200, 300, 400, 200, 300, 600, 800, 500, 400, 500, 800]
        }
    ]
}

export default withRoot(withRouter(withStyles(styles)(Pmi)));