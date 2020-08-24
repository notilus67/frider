"""backend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from server import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/getAppList/', views.getAppList, name='getAppList'),
    path('api/getAppInfo/', views.getAppInfo, name='getAppInfo'),
    path('api/appUnpack/', views.appUnpack, name='appUnpack'),
    path('api/injectApp/', views.injectApp, name='injectApp'),
    path('api/enumJavaClasses/', views.enumJavaClasses, name='enumJavaClasses'),
    path('api/enumJavaMethods/', views.enumJavaMethods, name='enumJavaMethods'),
    path('api/enumNativeModules/', views.enumNativeModules, name='enumNativeModules'),
    path('api/enumNativeExports/', views.enumNativeExports, name='enumNativeExports'),
    path('api/traceList/', views.traceList, name='traceList'),
    path('api/traceByAddress/', views.traceByAddress, name='traceByAddress'),
]
