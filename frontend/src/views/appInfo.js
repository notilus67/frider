import React from 'react';
import 'antd/dist/antd.css';
import '../index.css';
import { Descriptions, message } from 'antd';
import axios from 'axios';
import Qs from 'qs'

const mockData = {
  package: "com.mock.data",
  versionName: 'null',
  versionCode: 'null',
  sdk: 'minSdk=null',
  flags: "flags=null",
  privateFlags: "privateFlags=null",
  lastUpdateTime: "null",
  primaryCpuAbi: "primaryCpuAbi=null",
  secondaryCpuAbi: "secondaryCpuAbi=null",
  instructionSet: "Instruction Set:null",
  path: "path:null",
  status: "status:null",
  codePath: "codePath=null",
  resourcePath: "resourcePath=null",
  legacyNativeLibraryDir: "legacyNativeLibraryDir=null",
  dataDir: "dataDir=null",
  usesOptionalLibraries: "usesOptionalLibraries null",
  usesLibraryFiles: "usesLibraryFiles null",
  declaredPermissions: "declared permissions: null\n",
  requestedPermissions: "requested permissions: null\n",
};

class AppInfo extends React.Component {
  state = {
    data: mockData,
  };
  componentDidMount(){
    var selectedApp = JSON.parse(sessionStorage.getItem('selectedApp'));
    if (selectedApp === null) { return }
    const hide = message.loading('Request in progress..', 0);
    axios.post('http://127.0.0.1:8000/api/getAppInfo/',
      Qs.stringify({
        'package': selectedApp['package'],
        'pid': selectedApp['pid']
      }),
      {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
    ).then((response)=>{
      hide()
      console.log(response)
      if(response.status === 200){
        if (response.data['errCode'] === 0){
          message.success('success')
          console.log('getAppInfo success')
          this.setState({
            data: response.data['result']
          })
        }else{
          message.error(response.data['errMsg'], 10)
          console.log('getAppInfo fail')
          console.log(response.data['errMsg'])
        }
      }else{
        message.error('server error')
        console.log('server error')
      }
    }).catch((response)=>{
      console.log(response)
    })
  }
	render() {
    return (
      <div key='/appInfo'>
        <Descriptions title="App Info" bordered column={2}>
          <Descriptions.Item label="Package">{this.state.data.package}</Descriptions.Item>
          <Descriptions.Item label="Version">{this.state.data.versionName} ({this.state.data.versionCode})</Descriptions.Item>
          <Descriptions.Item label="Sdk">{this.state.data.sdk}</Descriptions.Item>
          <Descriptions.Item label="Flags">
          {this.state.data.flags}<br />
          {this.state.data.privateFlags}
          </Descriptions.Item>
          <Descriptions.Item label="LastUpdateTime">{this.state.data.lastUpdateTime}</Descriptions.Item>
          <Descriptions.Item label="ABI">
          {this.state.data.primaryCpuAbi}<br />
          {this.state.data.secondaryCpuAbi}<br />
          {this.state.data.instructionSet}
          </Descriptions.Item>
          <Descriptions.Item label="Paths" span={2}>
          {this.state.data.path}<br />
          {this.state.data.status}<br />
          {this.state.data.codePath}<br />
          {this.state.data.resourcePath}<br />
          {this.state.data.legacyNativeLibraryDir}<br />
          {this.state.data.dataDir}<br />
          {this.state.data.usesLibraryFiles}<br />
          {this.state.data.usesOptionalLibraries}
          </Descriptions.Item>
          <Descriptions.Item label="Permissions" span={2} style={{whiteSpace: 'pre-wrap'}}>
          {this.state.data.declaredPermissions}
          <br />
          {this.state.data.requestedPermissions}
          </Descriptions.Item>
        </Descriptions>,
      </div>
    );
  }
}

export default AppInfo;
