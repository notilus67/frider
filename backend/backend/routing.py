# channels routing 
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
# from server.ws import ChatConsumer
from server.functions.frida_main import ChatConsumer

from django.conf.urls import url

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter([
            url("api/ws/", ChatConsumer),
        ])
    ),
})