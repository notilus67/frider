import React from 'react';
import {Route, Switch} from 'react-router-dom';
import './config'

class ContentMain extends React.Component {
    render() {
        return (
            <div>
                <Switch>
                    <Route exact path='/' component={global.Home}/>
                    <Route exact path='/appInfo' component={global.AppInfo} />
                    <Route exact path='/appUnpack' component={global.AppUnpack} />
                    <Route exact path='/javaEnum' component={global.JavaEnum} />
                    <Route exact path='/javaNativeTrace' component={global.JavaNativeTrace} />
                    <Route exact path='/javaIntercept' component={global.JavaIntercept} />
                    <Route exact path='/nativeEnum' component={global.NativeEnum} />
                    <Route exact path='/nativeTODO' component={global.NativeTODO}/>        
                </Switch>
            </div>
        )
    }
}
export default ContentMain;

