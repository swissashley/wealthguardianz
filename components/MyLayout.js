import Header from "./Header"

const layoutStyle = {
    // margin: 10,
    // padding: 10,
    // border: "1px solid #DDD"
}

const Layout = (props) => (
    <div style={layoutStyle}>
        <Header />
        {props.children}
    </div>
)

export default Layout