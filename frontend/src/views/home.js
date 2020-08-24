import React from 'react';
import 'antd/dist/antd.css';
import '../index.css';
import { Typography, Button, Tooltip, Table, Input, Space, message } from 'antd';
import { Row, Col } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import Qs from 'qs'

const { Title, Paragraph, Text } = Typography;

const message_usb = (
    <div>
      adb forward tcp:27042 tcp:27042<br />
      adb forward tcp:27043 tcp:27043<br />
      ./frida-server
    </div>
)
  
const message_lan = (
    <div>
      ./frida-server -l 0.0.0.0
    </div>
)

const message_lan2 = (
  <div>
    Input phone IP address and the port number running frida-server
  </div>
)

// const mockData = [
//   {
//     key: "1",
//     pid: '233',
//     name: "I'm mock data",
//     identifier: 'com.mock.data',
//   },
// ];

class Home extends React.Component {
  state = {
    searchText: '',
    searchedColumn: '',
    data: null,
  };

  componentDidMount(){
    var appList = JSON.parse(sessionStorage.getItem('appList'));
    if (appList === null) { return };
    var selectedApp_string = sessionStorage.getItem('selectedApp')
    if (selectedApp_string !== null){
      this.setState({
        data: appList,
        selectedRowKeys : JSON.parse(selectedApp_string)['key'],
      });
    } else {
      this.setState({ 
        data: appList,
      });
    }
  };

  onConnect = (remote, address) => {
    const hide = message.loading('Action in progress..', 0);
    axios.post('http://127.0.0.1:8000/api/getAppList/',
      Qs.stringify({
        'remote': remote,
        'address': address
      }),
      {headers:{'Content-Type':'application/x-www-form-urlencoded'}}
    ).then((response)=>{
      hide()
      if(response.status === 200){
        console.log(response.data)
        if (response.data['errCode'] === 0){
          message.success('connect success')
          console.log('getAppList success');
          this.setState({
            data: response.data['result']
          });
          sessionStorage.setItem('appList', JSON.stringify(response.data['result']));
        }else{
          message.error(response.data['errMsg'], 10)
          console.log('connect fail')
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

	render() {
    const columns = [
      {
        title: 'Pid',
        dataIndex: 'pid',
        key: 'pid',
        ...this.getColumnSearchProps('pid'),
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        ...this.getColumnSearchProps('name'),

      },
      {
        title: 'Identifier',
        dataIndex: 'identifier',
        key: 'identifier',
        ...this.getColumnSearchProps('identifier'),

      },
      // {
      //   title: 'Action',
      //   key: 'select',
      //   render: text => <a>Select</a>,
      // },
    ];
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        this.setState({
          selectedRowKeys : selectedRowKeys,
        });        
        // save selected APP
        var selectedApp = JSON.stringify({
          package: selectedRows[0]['identifier'], 
          pid: selectedRows[0]['pid'],
          key: selectedRowKeys[0],
        })
        console.log("selectedApp:" + selectedApp)
        sessionStorage.setItem('selectedApp', selectedApp)
      },
      getCheckboxProps: record => ({
        disabled: record.name === 'Disabled User',
        // Column configuration not to be checked
        name: record.name,
      }),
    };
    
    return (
      <div key='/'>
        <Typography>
          <Title>Start frida-server</Title>
          <Paragraph>
            Before pressing <Text keyboard>Connect</Text>, you should check adb connectivity and either:
          </Paragraph>
          <Paragraph>
            <ul>
              <li>
                <Row>
                    <Col span={6}>
                    <Tooltip title={message_usb}>
                        <Text underline>run frida-server in USB mode</Text>
                    </Tooltip>
                    </Col>
                    <Col span={6}>
                      <Button type="primary" onClick={()=>{this.onConnect('0', '0')}}>Connect</Button>
                    </Col>
                </Row>
              </li>
              <li>
                <Row>
                  <Tooltip title={message_lan}>
                      <Text underline>run frida-server in LAN mode (TODO)</Text>
                  </Tooltip>
                </Row>
                <Row>
                  <Col span={6}>
                  <Tooltip title={message_lan2} placement="bottom">
                      <Input placeholder="192.168.0.1:1234" />
                  </Tooltip>
                  </Col>
                  <Col span={6}>
                  <Button type="primary">Connect</Button>
                  </Col>
                </Row>
              </li>
            </ul>
          </Paragraph>
          <Table 
            rowSelection={{
              type: "radio",
              selectedRowKeys: this.state.selectedRowKeys, // read last selection
              ...rowSelection,
            }}
            columns={columns}
            dataSource={this.state.data}
            pagination={{pageSizeOptions:[10,50,100]}} // paginatioTn
            size="small"/>
        </Typography>
      </div>
    );
  }
}

export default Home;
