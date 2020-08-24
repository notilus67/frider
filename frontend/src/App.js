import React from 'react';
import './App.css';
import {BrowserRouter as Router} from 'react-router-dom';
import 'antd/dist/antd.css';
import {Layout } from 'antd';
import SiderMenu from './views/siderMenu';
import ContentMain from './Router/router';

const {
	Sider, Content,
} = Layout;
//let screenHeight= window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

class App extends React.Component {
	render() {
		return (
			<div className="App" >
				<Router>  {/*** Important Tag ***/}
					<Layout>
						{/* <Sider className="App-customMenu" style={{height:screenHeight}}>? */}
						<Sider className="App-customMenu" style={{position: 'fixed'}}>
							<SiderMenu/>
						</Sider>
						<Layout>
							{/* <Content className="App-contentMain" style={{height:screenHeight}}> */}
							<Content className="App-contentMain" >
								<ContentMain/>
							</Content>
						</Layout>
					</Layout>
				</Router>
			</div>
		);
	}
}
export default App;
