#main.py

from gevent import monkey
monkey.patch_all()

import time
from threading import Thread
from flask import Flask, render_template, session, request
from flask_socketio import SocketIO, emit, join_room, disconnect



app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
thread = None


def background_stuff():
    """ Let's do it a bit cleaner """
    print("Thread started")
    #while True:
    time.sleep(1)
    t = str(time.clock())
    print("Going to emit message from python");
    socketio.emit('message', {'data': 'This is data', 'time': t}, namespace='/test')
       


@app.route('/')
def index():
    global thread
    """
    if thread is None:
        thread = Thread(target=background_stuff)
        thread.start()
        """
    return render_template('index.html')

@socketio.on('my event', namespace='/test')
def my_event(msg):
    
    print (msg['data'])

@socketio.on('connect', namespace='/test')
def test_connect():
    emit('my response', {'data': 'Connected', 'count': 0})

    

@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')
    
@socketio.on('message', namespace='/test')
def talking(msg):
    socketio.emit('message', {'data': 'This is data', 'time': 'yayyy we spoke!'+msg}, namespace='/test')
    

@app.route('/background_process_test')
def background_process_test():
    print("Background process tested")
    global thread
    
    if thread is None:
        thread = Thread(target=background_stuff)
        thread.start()
        
    return "nothing"
if __name__ == '__main__':
    socketio.run(app)
