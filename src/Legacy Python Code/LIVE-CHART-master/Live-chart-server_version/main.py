import numpy as np
import datautility as du
from time import sleep
# from flask import Flask, request, session, g, redirect, \
#      render_template
import os
import sys
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


SQL_FOLDER = 'resources/SQL/'
# app = Flask(__name__)
app_args = du.read_paired_data_file(os.path.dirname(os.path.abspath(__file__))+'\config_prod.txt')
# app.secret_key = app_args['secret_key']
db = None
skill_builders=[]

def connect_db():
    db = du.db_connect(app_args['db_name'], app_args['username'], app_args['password'],
                       host=app_args['host'], port=app_args['port'])
    return db


def time_to_seconds(db, time):
    _vars, _query = du.read_var_text_file(SQL_FOLDER + 'time_to_seconds_from_midnight.sql', sep=' ')
    _vars[':time'] = str(time)
    return du.db_query(db, _query, _vars)[0][0]


def seconds_to_time(db, time, date):
    _vars, _query = du.read_var_text_file(SQL_FOLDER + 'seconds_from_midnight_to_time.sql', sep=' ')
    _vars[':seconds_from_midnight'] = time
    _vars[':date'] = str(date)
    return str(du.db_query(db, _query, _vars)[0][0])


def earliest_action_time(db, date, class_section):
    _vars, _query = du.read_var_text_file(SQL_FOLDER + 'earliest_action_time.sql', sep=' ')
    _vars[':student_class_section_id'] = str(class_section)
    _vars[':date'] = date
    print("STR:",str(du.db_query(db, _query, _vars)))
    return str(du.db_query(db, _query, _vars)[0][0])


def get_all_actions(db, date, class_section):
    _vars, _query = du.read_var_text_file(SQL_FOLDER + 'get_all_actions.sql', sep=' ')
    _vars[':student_class_section_id'] = str(class_section)
    _vars[':date'] = date
    res, headers = du.db_query(db, _query, _vars, return_column_names=True)
    return {'headers': np.array(headers), 'data': np.array(res)}


def get_recent_actions(db, date, class_section, time, offset=1, source=None):
    if source is None:
        _vars, _query = du.read_var_text_file(SQL_FOLDER + 'recent_actions.sql', sep='\n')
        _vars[':seconds_from_midnight'] = time
        _vars[':student_class_section_id'] = str(class_section)
        _vars[':date'] = str(date)
        _vars[':time_offset'] = offset
        return du.db_query(db, _query, _vars, return_column_names=True)
    else:
        if source is not dict and (not len(source['data'].shape) == 2 or not source['data'].shape[-1] == 18):
            raise ValueError('Source must be the result of a get_all_actions call or None')
        return source['data'][np.argwhere([time-offset < i <= time for i in source['data'][:, -1]]).ravel(), :-1],\
               source['headers']


    
def find_sb():
        db = connect_db()
        query='SELECT id FROM class_assignments WHERE assignment_type_id = 1 AND sequence_id IN \
        (SELECT id FROM sequences WHERE head_section_id IN (SELECT id FROM sections WHERE position(\'astery\' IN type) > 0) AND id IN (\
		SELECT ns.sequence_id FROM (SELECT sequence_id, count(*) AS nsec FROM sections GROUP BY sequence_id) AS ns \
		LEFT OUTER JOIN ( SELECT sequence_id, count(*) AS npr FROM sections WHERE type=\'ProblemSection\' GROUP BY sequence_id ) AS np ON ns.sequence_id = np.sequence_id \
		WHERE ns.nsec = np.npr+1 ))'
        
        result = du.db_query(db, query)
        for i in range(len(result)):
            row=result[i]
            id = row[0]
            skill_builders.append(id)
         
        print("Retrieved all skill builders:") 

@app.route('/')
def index():
    global thread
    """
    if thread is None:
        thread = Thread(target=background_stuff)
        thread.start()
        """
    return render_template('index_2.html')



@app.route('/background_process_test')
def background_process_test():
    print("Background process tested")
    global thread
    
    if thread is None:
        thread = Thread(target=background_stuff)
        thread.start()
        
    return "nothing"  

def background_stuff():
    """ Let's do it a bit cleaner """
    print("Thread started")
    #while True:
    #time.sleep(1)
   # t = str(time.clock())
    print("Going to emit message from python");
    
    db = connect_db()

    date = '2018-06-08 8:00:00'
    class_section = 96681
    time = earliest_action_time(db, date, class_section)
    time_s = time_to_seconds(db, date)  # time_to_seconds(db,time)

    action_history = get_all_actions(db, date, class_section)

    increment = 1
    speed = 30
    while True:
        res, headers = get_recent_actions(db, date, class_section, time_s, increment, source=action_history)
        for i in res:
            msg = 'user {} :: {}'.format(i[3],i[8])
            print("Emitting msg")
            socketio.emit('message', {'data': 'This is data', 'message_sent': msg}, namespace='/test')
            print('{}: {}'.format(str(i[16]), msg))
        time_s += increment
        sleep(increment / speed)
    
    
    
    
    
    
    
    
        
               
if __name__ == '__main__':
    
    
    socketio.run(app)
    
    
    """
    db = connect_db()
    

    date = '2018-06-08 8:30:00'
   # date = '2018-11-12 19:00:00' #'2018-06-08 8:30:00'
    print("date:",date)
    class_section = 96681#114896 #99919 #96681 #99352 #96681
    time = earliest_action_time(db, date, class_section)
    time_s = time_to_seconds(db, date)  # time_to_seconds(db,time)

    action_history = get_all_actions(db, date, class_section)

    increment = 1
    speed = 10

    output_str = str(seconds_to_time(db,time_s,date))
    sys.stdout.write(output_str)
    sys.stdout.flush()
    old_str = output_str
    #find_sb()
    

    while True:
        sys.stdout.write('\r' + (' ' * len(old_str)) + '\r')
        sys.stdout.flush()
        output_str = str(seconds_to_time(db, time_s, date))
        sys.stdout.write(output_str)
        sys.stdout.flush()
        old_str = output_str
        
        #res, headers = get_recent_actions(db, date, class_section, time_s, increment, source=None)
        res, headers = get_recent_actions(db, date, class_section, time_s, increment, source=action_history)
        
        #exit(0)
        if len(res) > 0:
            #print(headers)
            #print(res)
            sys.stdout.write('\r' + (' ' * len(old_str)) + '\r')
            sys.stdout.flush()
            for i in res:
                msg = 'user {} :: {}'.format(i[3],i[8])
                print('{}: {}'.format(str(i[16]), msg))
                print("Assignment_id:",i[2])
                if(i[2] in skill_builders):
                    print("Skill builder")
        time_s += 1
        sleep(increment / speed)
        
    """
