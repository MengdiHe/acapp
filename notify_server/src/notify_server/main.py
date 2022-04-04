#! /usr/bin/env python3

import glob
import sys
sys.path.insert(0, glob.glob('../../../')[0])

from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer

import json
from notify_service import Notify
from django.core.cache import cache
from acapp.asgi import channel_layer
from asgiref.sync import async_to_sync

def notify_match_result(data):
    pset = json.loads(data)
    print(pset)
    p1 = pset["p1"]
    p2 = pset["p2"]
    p3 = pset["p3"]
    pset = [p1, p2, p3]
    room_name = "room_%s_%s_%s" % (p1["uuid"], p2["uuid"], p3["uuid"])
    players = []
    for p in pset:
        async_to_sync(channel_layer.group_add)(room_name, p["channel_name"])
        players.append({
            "uuid": p["uuid"],
            "username": p["username"],
            "photo": p["photo"],
            "hp": 100,
        })
    cache.set(room_name, players, 3600)
    for p in pset:
        async_to_sync(channel_layer.group_send)(
            room_name,
            {
                "type": "group_send_event",
                "event": "create_player",
                "uuid": p["uuid"],
                "username": p["username"],
                "photo": p["photo"],
            })

class NotifyHandler:
    def notify(self, opt, data):
        if opt == 1:
            notify_match_result(data)
        return 0

if __name__ == '__main__':
    handler = NotifyHandler()
    processor = Notify.Processor(handler)
    transport = TSocket.TServerSocket(host='0.0.0.0', port=8002)
    tfactory = TTransport.TBufferedTransportFactory()
    pfactory = TBinaryProtocol.TBinaryProtocolFactory()

    server = TServer.TSimpleServer(processor, transport, tfactory, pfactory)

    # You could do one of these for a multithreaded server
    # server = TServer.TThreadedServer(
    #     processor, transport, tfactory, pfactory)
    # server = TServer.TThreadPoolServer(
    #     processor, transport, tfactory, pfactory)

    print('Starting the server...')
    server.serve()
    print('done.')
