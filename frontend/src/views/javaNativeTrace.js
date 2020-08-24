import React from 'react';
import 'antd/dist/antd.css';
import '../index.css';
import { Typography, Button, Tooltip, Table, Space, message, Switch, Popconfirm, Timeline, Input } from 'antd';
import { Row, Col } from 'antd';
import axios from 'axios';
import Qs from 'qs'
import Websocket from 'react-websocket';

const { Title, Paragraph, Text } = Typography;

const message_inject = (
    <div>
      Inject frida scripts to target APP<br />
    </div>
)

const message_intercept = (
  <div>
    redirect to 127.0.0.1:8080<br />
    use BurpSuite(etc.) to intercept data<br />
  </div>
)

const message_addr = (
  <div>
    base address of a library<br />
    can be found on NativeEnumerate page<br />
  </div>
)


class JavaNativeTrace extends React.Component {
  state = {
    searchText: '',
    searchedColumn: '',
    traceList: null,
    onWebsocket: false,
    showStack: true,
    enableIntercept: false,
  };

  componentDidMount(){
    var selectedApp = JSON.parse(sessionStorage.getItem('selectedApp'));
    var injectedApp = sessionStorage.getItem('injectedApp');
    var traceList = JSON.parse(sessionStorage.getItem('traceList'));
    this.setState({
      selectedApp: selectedApp,
      package: selectedApp['package'],
      injectedApp: injectedApp,
      traceList: this.formatTraceListToShow(traceList),
    });
  };

  formatTraceListToShow= traceList => {
    // add 'key' to traceItems
    var formatTraceList = [];
    if(traceList !== null){
      for(let i=0;i<traceList.length;i++){
        const items = traceList[i].split("|||");
        const newItem = {
          key: i,
          class: items[0],  // class/module
          method: items[1], // method/export
          type: items[2],   // java/native
        };
        formatTraceList.push(newItem);
      }
    }
    return formatTraceList
  }

  formatTraceListToSend= traceList => {
    // add 'key' to traceItems
    var javaList = [];
    var nativeList = [];
    var result = null;
    if(traceList !== null){
      for(let i=0;i<traceList.length;i++){
        if (traceList[i]['type'] === 'java'){
          const newItem = {
            class: traceList[i]['class'],  // class/module
            method: traceList[i]['method'], // method/export
            parse: false,   // TODO: parse object
          };
          javaList.push(newItem)
        }
        if (traceList[i]['type'] === 'native'){
          const newItem = {
            module: traceList[i]['class'],  // class/module
            function: traceList[i]['method'], // method/export
            parse: false,   // TODO: parse object
          };
          nativeList.push(newItem)
        }
      }
      result = {
        java: javaList,
        native: nativeList,
        intercept: this.state.enableIntercept,
      };
    }
    return JSON.stringify(result);
  }

  onInject() {
    const hide = message.loading('Action in progress..', 0);
    axios.post('http://127.0.0.1:8000/api/injectApp/',
      Qs.stringify({
        'package': this.state.package,
      }),
      {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
    ).then((response)=>{
      hide()
      if(response.status === 200){
        console.log(response.data)
        if (response.data['errCode'] === 0){
          message.success('inject success')
          console.log('inject app(package) success');
          this.setState({
              injectedApp: this.state.package
          })
          sessionStorage.setItem('injectedApp', this.state.injectedApp);
          // this.onEnumClasses(); // auto enumerate java classes after injection 
        }else{
          message.error(response.data['errMsg'], 10)
          console.log('inject fail')
          console.log(response.data['errMsg'])
        }
      }else{
        message.error('server error')
        console.log('server error')
      }
    }).catch((response)=>{
      console.log(response)
    })
  };
  
  handleDelete = key => {
    const dataSource = [...this.state.traceList];
    this.setState({
      traceList: dataSource.filter(item => item.key !== key)
    });
    // delete sessionStorage
    const deleteItem = dataSource[key];
    const deleteString = deleteItem.class + "|||" + deleteItem.method + "|||" + deleteItem.type;
    var storageTraceList = JSON.parse(sessionStorage.getItem('traceList'));
    var index = storageTraceList.indexOf(deleteString);
    if (index > -1){
      storageTraceList.splice(index,1);
    }
    sessionStorage.setItem('traceList', JSON.stringify(storageTraceList));
  };

  pushTimeline = packet => {
    var traceLine = this.state.traceLine; // get existed timeline
    if (traceLine === null || traceLine === undefined){
      traceLine = [];
    }
    packet = JSON.parse(packet);
    const elementTitle = packet.data[2] + "::" + packet.data[3]; // classname::methodname
    if (packet.cmd === 'enter'){
      const args = packet.data[4];
      traceLine.push(<Timeline.Item color="green" key={traceLine.length}>
      <p>{elementTitle}</p>
      {args.map((arg, index) => {return <p>arg[{index}]: {args[index]}</p>})}
      </Timeline.Item>);
    };
    if (packet.cmd === 'exit'){
      const retval = packet.data[4];
      traceLine.push(<Timeline.Item color="green" key={traceLine.length}>
      <p>{elementTitle}</p>
      <p>retval: {retval}</p>
      </Timeline.Item>);
    };
    if (packet.cmd === 'stack' && this.state.showStack){
      const stack = packet.data[4];
      traceLine.push(<Timeline.Item color="green" key={traceLine.length}>
      <p>{elementTitle}</p>
      <span className="stack-show">{stack}</span>
      </Timeline.Item>);
    };
    this.setState({
      traceLine: traceLine,
    });
  };

  onTraceByList(){
    const hide = message.loading('Action in progress..', 0);
    axios.post('http://127.0.0.1:8000/api/traceList/',
      Qs.stringify({
        'list': this.formatTraceListToSend(this.state.traceList),
      }),
      {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
    ).then((response)=>{
      hide();
      if(response.status === 200){
        console.log(response.data)
        if (response.data['errCode'] === 0){
          message.success('trace added')
          console.log('trace added');
          this.setState({
            onWebsocket: true,
          });
        }else{
          message.error(response.data['errMsg'], 10)
          console.log('trace fail')
          console.log(response.data['errMsg'])
        }
      }else{
        message.error('server error')
        console.log('server error')
      }
    }).catch((response)=>{
      console.log(response)
    })
  };

  onTraceByAddress(){
    if(this.state.baseAddr !== null){
      const hide = message.loading('Action in progress..', 0);
      axios.post('http://127.0.0.1:8000/api/traceByAddress/',
        Qs.stringify({
          'baseAddr': this.state.baseAddr,
        }),
        {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
      ).then((response)=>{
        hide();
        if(response.status === 200){
          console.log(response.data)
          if (response.data['errCode'] === 0){
            message.success('trace added')
            console.log('trace added');
            this.setState({
              onWebsocket: true,
            });
          }else{
            message.error(response.data['errMsg'], 10)
            console.log('trace fail')
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
  };

  render() {
    const columns = [
      {
        title: 'Class/Module',
        dataIndex: 'class',
        key: 'class',
      },
      {
        title: 'Method/Function',
        dataIndex: 'method',
        key: 'method',
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
      },
      {
        title: 'Action',
        dataIndex: 'action',
        render: (text, record) =>
          this.state.traceList.length >= 1 ? (
            <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDelete(record.key)}>
              <a>Delete</a>
            </Popconfirm>
          ) : null,
      },
    ];
    return (
      <div key='/'>
        <Typography>
        <Title>Trace Java method / Native function</Title>
        <Paragraph>
            <Space>
                Current selected package: <b>{this.state.package}</b>. To inject/reinject, please press:
                <Tooltip title={message_inject}>
                    <Button type="primary" onClick={()=>{this.onInject()}}>Inject</Button>
                </Tooltip>
            </Space>
        </Paragraph>
        <Paragraph>
        Current injected package: <b>{this.state.injectedApp}</b>.
        </Paragraph>
        <Paragraph>
        <b>Attention:</b> When you want trace a native function, please manually parse arguments/retval in <Text code>backend\server\functions\frida_scripts\fridaAPI.js</Text> and re-inject. 
        </Paragraph>
        <Row>
          <Space>
            <Title level={2}>Plan A: Trace by list</Title>
            <Button type="primary" onClick={()=>{this.onTraceByList()}}>Start</Button>
          </Space>
        </Row>
        <Table 
          columns={columns}
          dataSource={this.state.traceList}
          pagination={false}
          size="small"/>
        <Title level={2}>Plan B: Trace by native address</Title>
        <Row>
          <Col span={6}>
          <Tooltip title={message_addr} placement="bottom">
            <Input onChange={(e)=>{this.setState({baseAddr: e.target.value})}} placeholder="base address" />
          </Tooltip>
          </Col>
          <Col span={6}>
            <Button type="primary" onClick={()=>{this.onTraceByAddress()}}>Start</Button>
          </Col>
        </Row>
        <Title level={2}>Tracer</Title>
        <Row>
          <Space>
          Show stack? <Switch defaultChecked onChange={(checked)=>{this.setState({showStack: checked})}} />
          <Tooltip title={message_intercept}>
          Intercept(Java) ? <Switch onChange={(checked)=>{this.setState({enableIntercept: checked})}} />
          </Tooltip>
          </Space>
        </Row>
          { this.state.traceLine? (  
            <Timeline>
              {this.state.traceLine}
            </Timeline>
          ): null }
        </Typography>
        { this.state.onWebsocket? (
          <Websocket url='ws://127.0.0.1:8000/api/ws/' onMessage={(packet)=>{this.pushTimeline(packet)}}/>
        ): null}
      </div>
    );
  }
}

export default JavaNativeTrace;
