import Layout from "../components/MyLayout"

export default () => {
    var names = ['Jake', 'Jon', 'Thruster'];
    var nameList = names.map((name) => {
        return (<li>{name}</li>);
    });
    console.log('hitting about');
    return (
        <Layout>
            <p>This is the about page</p>
            <ui>{nameList}</ui>
        </Layout>
    )
}