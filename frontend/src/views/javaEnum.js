import React from 'react';
import 'antd/dist/antd.css';
import '../index.css';
import { Typography, Button, Tooltip, Table, Input, Space, message, Checkbox, Tree } from 'antd';
import { Row, Col } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import Qs from 'qs'

const { Title, Paragraph } = Typography;

const message_inject = (
    <div>
      Inject frida scripts to target APP<br />
    </div>
)

const message_classFilter = (
    <div>
      className filter, default: *<br />
    </div>
)

const message_methodFilter = (
    <div>
      methodName filter, cannot be empty<br />
    </div>
)

// const mockClassData = [
//   {
//       key: '1',
//       class: 'com.mock.data',
//   },
// ];

// const treeData0 = [ 
//   {
//     title: 'loader: null',
//     key: '0-0',
//     children: [
//       {
//         title: 'class 1',
//         key: '0-0-0',
//         children: [
//           {
//             title: 'method 1',
//             key: '0-0-0-0',
//           },
//           {
//             title: 'method 2',
//             key: '0-0-0-1',
//           },
//         ],
//       },
//       {
//         title: 'class 2',
//         key: '0-0-1',
//         children: [
//           {
//             title: 'method 3',
//             key: '0-0-1-0',
//           },
//         ],
//       },
//     ],
//   },
// ];

class JavaEnum extends React.Component {
  state = {
    searchText: '',
    searchedColumn: '',
    classData: null,
    classFilter: '*',
    methodFilter: '',
    checkedValues: ['i', 's'],
  };

  componentDidMount(){
    var selectedApp = JSON.parse(sessionStorage.getItem('selectedApp'));
    var injectedApp = sessionStorage.getItem('injectedApp');
    this.setState({
      selectedApp: selectedApp,
      package: selectedApp['package'],
      injectedApp: injectedApp,
    });
    if (injectedApp != null){
      this.onEnumClasses();
    }
  };

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
          this.onEnumClasses(); // auto enumerate java classes after injection 
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

  onEnumClasses() {
    const hide = message.loading('Action in progress..', 0);
    axios.post('http://127.0.0.1:8000/api/enumJavaClasses/',
      {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
    ).then((response)=>{
      hide()
      if(response.status === 200){
        console.log(response.data)
        if (response.data['errCode'] === 0){
          message.success('enumerate classes success')
          console.log('enumerate Java classes success');
          this.setState({
              classData: response.data['result']
          })
        }else{
          message.error(response.data['errMsg'], 10)
          console.log('enumerate fail')
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

  onEnumMethods= query => {
    console.log("method query: " , query);
    const hide = message.loading('Action in progress..', 0);
    axios.post('http://127.0.0.1:8000/api/enumJavaMethods/',
      Qs.stringify({
        'query': query,
      }),
      {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
    ).then((response)=>{
      hide()
      if(response.status === 200){
        console.log(response.data)
        if (response.data['errCode'] === 0){
          message.success('enumerate methods success')
          console.log('enumerate Java methods success');
          this.setState({
            treeData: this.processMethodData(response.data['result']),
          })
        }else{
          message.error(response.data['errMsg'], 10)
          console.log('enumerate fail')
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

  // processMethodData is to be improved
  processMethodData = methodData => {
    const nodeList = []
    const loaderNum = methodData.length
    for(let i=0;i<loaderNum;i++){
      const currentLoader = methodData[i]
      const key0 = `0-${i}`;
      const loaderNode = {
        title: 'loader: ' + currentLoader['loader'],
        key: key0,
      }
      const classNum = currentLoader['classes'].length
      const classList = []
      for(let j=0;j<classNum;j++){
        const currentClass = currentLoader['classes'][j];
        const key1 = `0-${i}-${j}`;
        const classNode = {
          title: currentClass['name'],
          key: key1,
        }
        const methodNum = currentClass['methods'].length
        const methodList = []
        for(let k=0;k<methodNum;k++){
          const key2 = `0-${i}-${j}-${k}`;
          methodList.push({
            p_title: currentClass['name'], // save parent(class) name
            title: currentClass['methods'][k],
            key: key2,
          });
        };
        classNode.children = methodList;
        classList.push(classNode);
      }
      loaderNode.children = classList
      nodeList.push(loaderNode)
    }
    return nodeList
  };

  onSearch() {
    if(this.state.methodFilter === ''){
      message.error('method filter cannot be empty!');
      return;
    }
    const query = this.state.classFilter + '!' + this.state.methodFilter + '/' + this.state.checkedValues.join('')
    this.onEnumMethods(query);
  }

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : '',
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    },
    render: text =>
      this.state.searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[this.state.searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    this.setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex,
    });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: '' });
  };

  onCheckboxChange = (checkedValues) => {
    console.log('checkedBox = ', checkedValues);
  };

  onSelectMethod = (selectedKeys, ev) => {
    // console.log('selected', selectedKeys, ev);
    // add new item to traceList
    if (ev.node.hasOwnProperty('p_title')){
      var traceList = JSON.parse(sessionStorage.getItem('traceList'));
      var itemString = ev.node['p_title'] + "|||" + ev.node['title'] + "|||"  + 'java';
      if (traceList == null){
        traceList = []
        traceList.push(itemString);
        console.log(traceList)
        message.success('added to traceList')
      }else{
        if (traceList.indexOf(itemString) === -1){ // no repeat
          traceList.push(itemString);
          message.success('added to traceList');
          message.info('already in the list');
        }
      }
      sessionStorage.setItem('traceList', JSON.stringify(traceList));
    }
  };
  
  render() {
    const columns = [
      {
        title: 'Class',
        dataIndex: 'class',
        key: 'class',
        ...this.getColumnSearchProps('class'),
      },
      {
        title: 'Action',
        key: 'select',
        render: (text, record) => <a onClick={()=>{this.onEnumMethods(record.class+'*!*/is')}}>Enumerate Methods</a>,
      },
    ];
    return (
      <div key='/'>
        <Typography>
        <Title>Enumerate Java Class/Method</Title>
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
        <Title level={2}>Plan A: Find method by class</Title>
          <Table 
            columns={columns}
            dataSource={this.state.classData}
            pagination={{pageSizeOptions:[10,50,100]}} // pagination
            size="small"/>
        <Title level={2}>Plan B: Find method by filter</Title>
        <Paragraph>
            <Checkbox.Group style={{ width: '100%' }} onChange={checkedValues=>{this.setState({checkedValues: checkedValues})}} defaultValue={'is'}>
                <Checkbox value="i">Case-insensitive</Checkbox>
                <Checkbox value="s">Include method signatures</Checkbox>
                <Checkbox value="u">User-defined classes only</Checkbox>
            </Checkbox.Group>
        </Paragraph>
        <Paragraph>
          <Row>
          <Col span={4}>
          <Tooltip title={message_classFilter} placement="bottom">
              <Input placeholder="*MainActivity*" onChange={(ev)=>{this.setState({classFilter: ev.target.value})}}/>
          </Tooltip>
          </Col>
          <Col span={4}>
          <Tooltip title={message_methodFilter} placement="bottom">
              <Input placeholder="*decrypt*" onChange={(ev)=>{this.setState({methodFilter: ev.target.value})}}/>
          </Tooltip>
          </Col>
          <Col span={4}>
              <Button type="primary" onClick={()=>{this.onSearch()}}>Search</Button>
          </Col>
          </Row>
        </Paragraph>
        <Title level={2}>Method List (click method to join trace list)</Title>
          { this.state.treeData? (  // wait for data, otherwise defaultExpandAll won't take effect
          <Tree
            defaultExpandAll
            onSelect={this.onSelectMethod}  // Click Method, join TraceList
            treeData={this.state.treeData}
          />
          ): null }
        </Typography>
      </div>
    );
  }
}

export default JavaEnum;
