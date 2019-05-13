import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Paper from '@material-ui/core/Paper';
import ReactHtmlParser from 'react-html-parser';

export class EnhancedTableHead extends React.Component {
    createSortHandler = property => event => {
        this.props.onRequestSort(event, property);
    };

    render() {
        const { order, orderBy, columnData } = this.props;
        var rowCount = 0;
        return (
            <TableHead>
                <TableRow key={'rowhead' + (rowCount++)}>
                    {columnData.map(column => {
                        return (
                            <TableCell
                                key={column.id}
                                numeric={column.numeric}
                                padding={column.disablePadding ? 'none' : 'default'}
                                sortDirection={orderBy === column.id ? order : false}
                            >
                                    <TableSortLabel
                                        active={orderBy === column.id}
                                        direction={order}
                                        onClick={this.createSortHandler(column.id)}
                                    >
                                        {column.label}
                                    </TableSortLabel>
                            </TableCell>
                        );
                    }, this)}
                </TableRow>
            </TableHead>
        );
    }
}

EnhancedTableHead.propTypes = {
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.string.isRequired,
    orderBy: PropTypes.string.isRequired,
};

const styles = theme => ({
    root: {
        width: '100%',
    },
    table: {
        minWidth: 100,
    },
    tableWrapper: {
        overflowX: 'auto',
        height: '400px',
    },
});

export class EnhancedTable extends React.Component {

    constructor(props) {
        super(props);

        if (this.props.data && this.props.data.length > 0 && this.props.data[0].counts) {
            this.state = {
                order: 'desc',
                orderBy: 'counts',
                data: this.props.data.sort((a, b) => (a.counts > b.counts ? -1 : 1)),
                columnData: this.props.columnData,
            };
        } else {
            this.state = {
                order: 'desc',
                orderBy: 'duration',
                data: this.props.data.sort((a, b) => (a.duration > b.duration ? -1 : 1)),
                columnData: this.props.columnData,
            };
        }
        this.handleClick = this.handleClick.bind(this);
    }

    handleRequestSort = (event, property) => {
        const orderBy = property;
        let order = 'desc';

        if (this.state.orderBy === property && this.state.order === 'desc') {
            order = 'asc';
        }

        const data =
            order === 'desc'
                ? this.state.data.sort((a, b) => (b[orderBy] < a[orderBy] ? -1 : 1))
                : this.state.data.sort((a, b) => (a[orderBy] < b[orderBy] ? -1 : 1));

        this.setState({ data, order, orderBy });
    };

    handleClick = (data, type) => e => {
        e.preventDefault();
        this.props.updateRow(data, type);
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.state.data) {
            if (nextProps.data && nextProps.length > 0 && nextProps.data[0].counts) {
                this.setState({
                    data: nextProps.sort((a, b) => (a.counts > b.counts ? -1 : 1)),
                });
            } else {
                this.setState({
                    data: nextProps.data
                });
            }
        }
    }

    render() {
        const { classes, updateRow, key } = this.props;
        const { columnData, data, order, orderBy } = this.state;
        var rowCount = 0;
        return (
            <Paper className={classes.root}>
                <div className={classes.tableWrapper}>
                    <table className={classes.table}>
                        <EnhancedTableHead
                            columnData={columnData}
                            order={order}
                            orderBy={orderBy}
                            onRequestSort={this.handleRequestSort}
                        />
                        <TableBody key={key}>
                            {data.map(n => {
                                var keyData = n.hash ? n.hash : n.name;
                                var dataType = n.hash ? 'consolidation' : 'service';
                                return (
                                     <TableRow hover key={"rowbody_" + (rowCount++)} onClick={updateRow ? (this.handleClick(keyData, dataType)) : null}>
                                        {
                                            Object.keys(n).map((key) => {
                                                if (key === 'hash' || key ==='fileStack' || key === 'serviceData') {

                                                } else if (key == 'name' || key == 'trace' || key == 'thriftMethodName') {
                                                    return <TableCell key={"cell_" + n[key]}>{ReactHtmlParser(n[key])}</TableCell>
                                                } else {
                                                    return (<TableCell numeric key={"cell_" + key}>{n[key]}</TableCell>);
                                                }
                                            })
                                        }
                                     </TableRow>
                                );
                            })}
                        </TableBody>
                    </table>
                </div>
            </Paper>
        );
    }
}

EnhancedTable.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(EnhancedTable);
