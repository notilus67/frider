import React from 'react';
import 'antd/dist/antd.css';
import '../index.css';
import { Typography, } from 'antd';

const { Title } = Typography;

class JavaTODO extends React.Component {
  componentDidMount(){

  };
  render() {
    return (
      <div key='/'>
        <Typography>
        <Title>TODO</Title>
        </Typography>
      </div>
    );
  }
}

export default JavaTODO;
