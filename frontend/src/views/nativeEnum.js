import React from 'react';
import 'antd/dist/antd.css';
import '../index.css';
import { Typography, Button, Tooltip, Table, Input, Space, message,Radio, Switch } from 'antd';
import { Row } from 'antd';
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

const message_refresh = (
  <div>
    Refresh this page to see later-loaded modules<br />
  </div>
)

const mockModuleData = [
  {
    appOnly: [
      // {
      //     key: '1',
      //     name: 'mock',
      //     class: '0x1',
      //     size: 0,
      //     path: "/",
      // },
    ],
    all: [
      // {
      //   key: '1',
      //   name: 'mock',
      //   class: '0x1',
      //   size: 0,
      //   path: "/",
      // },
    ],
  },
];

class NativeEnum extends React.Component {
  state = {
    searchText: '',
    searchedColumn: '',
    moduleData: mockModuleData,
  };

  componentDidMount(){
    var selectedApp = JSON.parse(sessionStorage.getItem('selectedApp'));
    var injectedApp = sessionStorage.getItem('injectedApp');
    this.setState({
      selectedApp: selectedApp,
      package: selectedApp['package'],
      injectedApp: injectedApp,
      showModuleData: this.state.moduleData['appOnly'],
    });
    if (injectedApp != null){
      this.onEnumModules();
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
          this.onEnumModules(); // auto enumerate java classes after injection 
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

  onEnumModules() {
    const hide = message.loading('Action in progress..', 0);
    axios.post('http://127.0.0.1:8000/api/enumNativeModules/',
      {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
    ).then((response)=>{
      hide()
      if(response.status === 200){
        console.log(response.data)
        if (response.data['errCode'] === 0){
          message.success('enumerate native modules success')
          console.log('enumerate native modules success');
          this.setState({
            moduleData: response.data['result'],
            showModuleData: response.data['result']['appOnly'],
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

  onEnumExports= module => {
    const hide = message.loading('Action in progress..', 0);
    axios.post('http://127.0.0.1:8000/api/enumNativeExports/',
      Qs.stringify({
        'module': module,
      }),
      {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
    ).then((response)=>{
      hide()
      if(response.status === 200){
        console.log(response.data)
        if (response.data['errCode'] === 0){
          message.success('enumerate native exports success')
          console.log('enumerate native exports success');
          this.setState({
            exportData: response.data['result'],
            showExportData: response.data['result']['functions']  // default show functions
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

  onSelectExport = (record) => {
    if (record['type'] === 'function'){
      var traceList = JSON.parse(sessionStorage.getItem('traceList'));
      var itemString = record['module'] + "|||" + record['name'] + "|||" + "native";
      if (traceList == null){
        traceList = []
        traceList.push(itemString);
        message.success('added to traceList')
      }else{
        if (traceList.indexOf(itemString) === -1){ // no repeat
          traceList.push(itemString);
          message.success('added to traceList');
          message.info('already in the list');
        }
      }
      sessionStorage.setItem('traceList', JSON.stringify(traceList));
    }else{
      // select variable
      message.error('cannot trace variable')
    }
  };
  
  render() {
    const moduleColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        ...this.getColumnSearchProps('name'),
      },
      {
        title: 'Base Address ',
        dataIndex: 'base',
        key: 'base',
        ...this.getColumnSearchProps('base'),
      },
      {
        title: 'Size (bytes)',
        dataIndex: 'size',
        key: 'size',
        ...this.getColumnSearchProps('size'),
      },
      {
        title: 'Path',
        dataIndex: 'path',
        key: 'path',
        ...this.getColumnSearchProps('path'),
      },
      {
        title: 'Action',
        key: 'select',
        render: (text, record) => <a onClick={()=>{this.onEnumExports(record.name)}}>Enumerate Exports</a>,
      },
    ];
    const exportColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        ...this.getColumnSearchProps('name'),
      },
      {
        title: 'Address ',
        dataIndex: 'address',
        key: 'address',
        ...this.getColumnSearchProps('address'),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
      },
      {
        title: 'Action',
        key: 'select',
        render: (text, record) => <a onClick={()=>{this.onSelectExport(record)}}>Trace</a>,
      },
    ];
    return (
      <div key='/'>
        <Typography>
        <Title>Enumerate Native Library/Export</Title>
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
        <Title level={2}>
          <Tooltip title={message_refresh}>Find exports by module</Tooltip>
        </Title>
        <Row>
          <Space>
          Show app modules only? <Switch defaultChecked onChange={(checked)=>{this.setState({showModuleData: checked ? this.state.moduleData['appOnly'] : this.state.moduleData['all']})}} />
          </Space>
        </Row>
        <Table 
          columns={moduleColumns}
          dataSource={this.state.showModuleData}
          pagination={{pageSizeOptions:[10,50,100]}} // pagination
          size="small"/>
        <Title level={2}>Exports List</Title>
          { this.state.exportData? (
          <div>
            <Row>
              <Space>
              Show: 
              <Radio.Group value={this.state.showExportData} onChange={(ev)=>{this.setState({showExportData: ev.target.value})}}>
                <Radio value={this.state.exportData['functions']}>functions</Radio>
                <Radio value={this.state.exportData['variables']}>variables</Radio>
              </Radio.Group>
              </Space>
            </Row>
            <Table 
              columns={exportColumns}
              dataSource={this.state.showExportData}
              pagination={{pageSizeOptions:[10,50,100]}} // pagination
              size="small"/>
          </div>
          ): null }
        </Typography>
      </div>
    );
  }
}

export default NativeEnum;
