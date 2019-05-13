import Layout from "../components/MyLayout.js";
import {Component} from "react";
import Link from "next/link";
import env from "../lib/env";
import withRoot from '../src/withRoot';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    root: {
        textAlign: 'center',
        paddingTop: theme.spacing.unit * 20,
    },
});

class Index extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Layout>
                {'Please find Zipkin-Police in Jukwaa/CCTV'}
            </Layout>
        )
    }
}

export default withRoot(withStyles(styles)(Index));
