import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { AndroidOutlined, LaptopOutlined, HomeOutlined} from '@ant-design/icons';
import 'antd/dist/antd.css';
import '../index.css';

const { Sider } = Layout;
const { SubMenu } = Menu;

class SiderMenu extends React.Component {
  render() {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider className="siderMenu-sider">
                <div className="logo" />
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                    <Menu.Item key="1" icon={<HomeOutlined />}>
                        <Link to='/'>Home</Link>
                    </Menu.Item>
                    <SubMenu key="app" icon={<AndroidOutlined />} title="APP">
                        <Menu.Item key="2">
                            <Link to='/appInfo'>AppInfo</Link>
                        </Menu.Item>
                        <Menu.Item key="3">
                            <Link to='/appUnpack'>AppUnpack</Link>    
                        </Menu.Item>
                    </SubMenu>
                    <SubMenu key="java" icon={<LaptopOutlined />} title="JAVA">
                        <Menu.Item key="4">
                            <Link to='/javaEnum'>Enumerate</Link>
                        </Menu.Item>
                        <Menu.Item key="5">
                            <Link to='/javaNativeTrace'>Trace</Link>
                        </Menu.Item>
                        <Menu.Item key="6">
                            <Link to='/javaTODO'>TODO</Link>
                        </Menu.Item>
                    </SubMenu>
                    <SubMenu key="native" icon={<LaptopOutlined />} title="NATIVE">
                        <Menu.Item key="7">
                            <Link to='/nativeEnum'>Enumerate</Link>
                        </Menu.Item>
                        <Menu.Item key="8">
                            <Link to='/javaNativeTrace'>Trace</Link>
                        </Menu.Item>
                        <Menu.Item key="9">
                            <Link to='/nativeTODO'>TODO</Link>
                        </Menu.Item>
                    </SubMenu>
                </Menu>
            </Sider>
        </Layout>
    );
  }
}

//ReactDOM.render(<SiderMenu />, document.getElementById('root'));

export default SiderMenu;