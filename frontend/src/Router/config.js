import Loadable from 'react-loadable';
import Loading from '../loading/loader';

global.Home = Loadable(
    {
        loader: () => import('../views/home'),
        loading: Loading
    }
);

global.AppInfo = Loadable(
    {
        loader: () => import('../views/appInfo'),
        loading: Loading
    }
);

global.AppUnpack = Loadable(
    {
        loader: () => import('../views/appUnpack'),
        loading: Loading
    }
);

global.JavaEnum = Loadable(
    {
        loader: () => import('../views/javaEnum'),
        loading: Loading
    }
);

global.JavaNativeTrace = Loadable(
    {
        loader: () => import('../views/javaNativeTrace'),
        loading: Loading
    }
);

global.JavaTODO = Loadable(
    {
        loader: () => import('../views/javaTODO'),
        loading: Loading
    }
);

global.NativeEnum = Loadable(
    {
        loader: () => import('../views/nativeEnum'),
        loading: Loading
    }
);

global.NativeTODO = Loadable(
    {
        loader: () => import('../views/nativeTODO'),
        loading: Loading
    }
);
