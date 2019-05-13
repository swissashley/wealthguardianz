import Link from "next/link"
import Router from 'next/router'
import Head from 'next/head'
import NProgress from 'nprogress'

Router.onRouteChangeStart = (url) => {
    console.log(`Loading: ${url}`)
    NProgress.start()
}
Router.onRouteChangeComplete = () => NProgress.done()
Router.onRouteChangeError = () => NProgress.done()

const linkStyle = {
    marginRight: 15
}

const Header = () => (
    <div>
        <Head>
            {/* Import CSS for nprogress */}
            <link rel='stylesheet' type='text/css' href='/static/nprogress.css' />
        </Head>
    </div>
)

export default Header