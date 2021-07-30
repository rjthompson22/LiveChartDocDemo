# Basic blask server to catch events
from flask import Flask, render_template
from flask.ext.socketio import SocketIO, emit
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
@socketio.on('my event')                          # Decorator to catch an event called "my event":
def test_message(message):                        # test_message() is the event callback function.
    emit('my response', {'data': 'got it!'})      # Trigger a new event called "my response" 
                                                  # that can be caught by another callback later in the program.
if __name__ == '__main__':
    socketio.run(app)

"""

# Basic Flask Python Web App
from flask import Flask
app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello World!"

if __name__ == "__main__":
    app.run(threaded=True, debug=False, host='0.0.0.0',port=8081)

    
"""