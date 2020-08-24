import React from 'react';
import 'antd/dist/antd.css';
import '../index.css';
import { Typography,message, Card, Select, Button, Switch } from 'antd';
import { Row,} from 'antd';
import axios from 'axios';
import Qs from 'qs'

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

class AppUnpack extends React.Component {
  state = {
      package: "null",
      selectedApp: "null",
      selectedPlan: "Frida-Apk-Unpack",
      isChinese: false,
      isEnglish: true,
  };

  componentDidMount(){
    var selectedApp = JSON.parse(sessionStorage.getItem('selectedApp'));
    this.setState({
      selectedApp: selectedApp,
      package: selectedApp['package'],
    })
  };

  onUnpack(){
    const hide = message.loading('Action in progress..', 0);
    axios.post('http://127.0.0.1:8000/api/appUnpack/',
      Qs.stringify({
        'selectedApp': JSON.stringify(this.state.selectedApp),
        'plan': this.state.selectedPlan,
      }),
      {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
    ).then((response)=>{
      hide()
      if(response.status === 200){
        console.log(response.data)
        if (response.data['errCode'] === 0){
          message.success('Unpack success')
          message.success('Check output folder')
          console.log('Unpack success');
        }else if (response.data['errCode'] === 1){
          // message.error('Script execution failed')
          message.error(response.data['errMsg'], 10)
          console.log('Script execution failed or timeout')
          console.log(response.data['errMsg'])
        }else if (response.data['errCode'] === 2){
          message.error('Copy to PC failed')
          message.error(response.data['errMsg'], 10)
          console.log('Copy to PC failed')
          console.log(response.data['errMsg'])
        }else if (response.data['errCode'] === 3){
          message.error('Target APP is not running', 10)
          message.error(response.data['errMsg'], 10)
          console.log('Target APP is not running')
          console.log(response.data['errMsg'])
        }else if (response.data['errCode'] === 4){
          message.error(response.data['errMsg'], 10)
          console.log(response.data['errMsg'])
        }else{
          // placeholder
        }
      }else{
        message.error('server error')
        console.log('server error')
      }
    }).catch((response)=>{
      console.log(response)
    })
  };

  handleChange = (value) => {
    console.log(`selected ${value}`);
    this.setState({
      selectedPlan: value,
    })
  };

  onTranslate(){
    this.setState({
      isChinese: !this.state.isChinese,
      isEnglish: !this.state.isEnglish,
    })
  };

	render() {
    return (
      <div key='/appUnpack'>
        <Typography>
          <Title>Unpack App</Title>
          <Paragraph>Dump unpacked Android dex files to <Text code>./backend/server/output/</Text></Paragraph>
          <Paragraph>Your current chosen package: <b>{this.state.package}</b></Paragraph>
          <Paragraph>Choose an unpack plan:
            <Select defaultValue="Frida-Apk-Unpack" style={{ width: 200, marginLeft: 10 }} onChange={this.handleChange}>
              <Option value="Frida-Apk-Unpack">Frida-Apk-Unpack</Option>
              <Option value="FRIDA-DEXDump">FRIDA-DEXDump</Option>
            </Select>
            <Button type="primary" onClick={()=>{this.onUnpack()}}>GO</Button>
          </Paragraph>
          <Paragraph>
            <Row>
              <Card title="Frida-Apk-Unpack" extra={<a href="https://github.com/GuoQiang1993/Frida-Apk-Unpack" target="_blank" rel="noopener noreferrer">More</a>} style={{ width: 300, marginRight: 10 }}>
                <p>Authur: <a href="https://github.com/GuoQiang1993/" target="_blank" rel="noopener noreferrer">GuoQiang1993</a></p>
                <p>Android 4.4 and higher</p>
                <p>Hook art/runtime/dex_file.cc OpenMemory or OpenCommon</p>
              </Card>
              <Card title="FRIDA-DEXDump" extra={<a href="https://github.com/hluwa/FRIDA-DEXDump" target="_blank" rel="noopener noreferrer">More</a>} style={{ width: 300, marginRight: 10 }}>
                <p>Authur: <a href="https://github.com/hluwa/" target="_blank" rel="noopener noreferrer">hluwa</a></p>
                <p>All Android version supported by Frida</p>
                <p>Fuzzy search on memory</p>
                <p>Support muti-processes application</p>
                <p><b>APP must be running on the surface</b></p>
              </Card>
              <Card title="Custom" style={{ width: 300, marginRight: 10 }}>
                <p>TODO</p>
              </Card>
            </Row>
          </Paragraph>
          <Title level={4}>Tips: </Title>
          <Paragraph>
            { this.state.isEnglish? (
              <ul>
                <li>
                Frida-Apk-Unpack will save dump files to <Text code>/data/data/(packageName)</Text> first, then copy them to PC directory by <Text code>adb pull</Text>. <br />
                If you can't execute <Text code>adb root</Text>, it will also save files to <Text code>/sdcard/Frider/(packageName)</Text> for transit. <br />
                These directories won't be cleaned automatically. 
                </li>
                <li>
                Running Frida-Apk-Unpack first and leaving the app on the surface may help for running FRIDA-DEXDump successfully. 
                </li>
                <li>
                It's recommended to check output folder even if you meet timeout error when running FRIDA-DEXDump.
                </li>
              </ul>
              ): null }
            { this.state.isChinese? (
              <ul>
                <li>
                Frida-Apk-Unpack会先保存在<Text code>/data/data/(packageName)</Text>，然后通过<Text code>adb pull</Text>发到PC上；<br />
                如无法成功执行<Text code>adb root</Text>，将会使用<Text code>/sdcard/Frider/(packageName)</Text>进行中转。<br />
                这些目录（暂时）不会自动清理。
                </li>
                <li>
                在跑 FRIDA-DEXDump 之前先跑一遍 Frida-Apk-Unpack 可能会有助于绕过 ptrace 占用。
                </li>
                <li>
                如果跑 FRIDA-DEXDump 遇到 timeout 报错，请依然检查 output 目录是否有 dex 文件。
                </li>
              </ul>
            ): null}
          </Paragraph>
          <Row>
          中文翻译：
          <Switch onChange={()=>{this.onTranslate()}} />
          </Row>
        </Typography>
      </div>
    );
  }
}

export default AppUnpack;
