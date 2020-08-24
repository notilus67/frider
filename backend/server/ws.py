# websocket
from channels.generic.websocket import WebsocketConsumer
from channels.exceptions import StopConsumer

class ChatConsumer(WebsocketConsumer):
    def websocket_connect(self, message):
        self.accept()
    def websocket_receive(self, message):
        print(message)
        msg = message['text']
        self.send(msg)
    def websocket_send(self, packet):
        # print(packet)
        self.send(text_data=str(packet))
    def websocket_disconnect(self, message):
        # 服务端触发异常 StopConsumer
        raise StopConsumer