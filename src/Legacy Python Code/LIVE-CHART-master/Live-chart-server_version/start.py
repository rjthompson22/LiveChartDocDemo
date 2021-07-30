from flask import Flask, request, session, g, redirect, \
     render_template
import datautility as du
import evaluationutility as eval
from numpy import random as rand
import os
import time
import json
import numpy as np
import pandas as pd
import datetime
import numpy as np
import datautility as du
from time import sleep
import Student
from gevent import monkey
monkey.patch_all()
import time as t2
import time
from threading import Thread
from flask import Flask, render_template, session, request
from flask_socketio import SocketIO, emit, join_room, disconnect
import os
import sys
from time import sleep

SQL_FOLDER = 'resources/SQL/'
class_=0
section_=0

thread = None
input=None

all_studentids=[] #Global var to store all student ids
class_time='2018-12-12 00:00:00.000'
app = Flask(__name__)
app_args = du.read_paired_data_file(os.path.dirname(os.path.abspath(__file__))+'\config_prod.txt')

app_args2 = du.read_paired_data_file(os.path.dirname(os.path.abspath(__file__))+'\config_prod2.txt')
app.secret_key = app_args['secret_key']
app.secret_key2 = app_args2['secret_key']
db = None
socketio = SocketIO(app)

all_student_objects={} #Global var to store all student objects
skill_builders=[]

def connect_db():
    db = du.db_connect(app_args['db_name'], app_args['username'], app_args['password'],
                       host=app_args['host'], port=app_args['port'])
    print("IN connect DB",db)
    return db

def connect_db_2():
    db = du.db_connect(app_args2['db_name'], app_args2['username'], app_args2['password'],
                       host=app_args2['host'], port=app_args2['port'])
    print("IN connect DB of 2.0",db)
    return db
def get_db():
    with app.app_context():
        if not hasattr(g, 'db'):
            g.db = connect_db()
        return g.db

@app.route('/')
def root():
    msg = ''
    global thread
    # Display indicator message if available
    if 'message' in session:
        msg = session['message']
        session['message'] = ''
    # Render login page
    
    #return "Connected to db"
    return render_template('index.html', message=msg)
    
@app.route('/login', methods=['POST'])
def login():
    # get database handle
    
   
    db = get_db()
    args=[]
    print("USER ID Entered by teacher:",request.form['userid'])
    # search database for the user
    query = 'select distinct student_class_id,student_class_section_id from enrollments where student_class_id in (select distinct student_class_id \
        from teacher_classes where teacher_id=(select id from user_roles where user_id={} and type=\'Teacher\' ));'.format(request.form['userid'])
    print("QUERY")
    print(query)

    
    res = du.db_query(db, query)
    print(res)
    class_num=1
    data=[]
   
   #Getting all the classes and sections under the entered user id
    for i in range(len(res)):
        print("i:",i)
        student_class=res[i]
        class_id = str(student_class[0])
        section_id = str(student_class[1])
        item = {"class_id":class_id,"section":section_id}
        data.append(item)
       
    jsonData=json.dumps(data)    
        
    print(jsonData)
    
    return render_template('live_choose_class.html', jsonData=jsonData) 

@app.route('/chooseClass', methods=['POST'])
def chooseClass():
    #Getting names of the students from chosen class
    #If there already exists a table of the class_name, then use that. Else create a table.
    global db
    #db = get_db()
    class_section=str(request.form['classid'])
       
    arr=class_section.split(' ')
    print("Class:",arr[0])
    print("Section:",arr[1])
    global class_
    global section_
    class_=arr[0]
    section_=arr[1]
    print("Class by teacher:",request.form['classid'])
    global class_time
    class_time=request.form['classDateTime']
    stripped_time=datetime.datetime.strptime(class_time, '%Y-%m-%d'+'T'+'%H:%M')
    print("stripped_time:",stripped_time)
    stripped_time = stripped_time + datetime.timedelta(milliseconds=1)
    stripped_time=stripped_time.strftime("%Y-%m-%d %H:%M:%S.%f")
    
    
    
    print("Class time :",class_time)
    #query = 'select distinct student_class_id,student_class_section_id from enrollments where student_class_id=(select student_class_id \
    #    from teacher_classes where teacher_id=(select id from user_roles where user_id={} and type=\'Teacher\'));'.format(request.form['userid'])
    query = 'select user_id,first_name,last_name from user_details where user_id in (select user_id from user_roles where type=\'Student\' and id in (  \
    select distinct(student_id) from enrollments where student_class_id={} and student_class_section_id={}));'.format(int(arr[0]),int(arr[1]))
    print("QUERY")
    print(query)
    
    
    
    res = du.db_query(db, query)
    print(res)
    session['table_name']="class_"+arr[0]+"_"+arr[1]
    #After obtaining the names, send it in json to html to populate buttons
    data=[]
    
    query = 'CREATE TABLE IF NOT EXISTS {}(user_id integer,first_name varchar(60),last_name varchar(60),position_x varchar(10),position_y varchar(10));'.format(session['table_name'])
    
    du.db_query(db,query)
    
    query = 'SELECT count(*) from {}'.format(session['table_name'])
    
    count=du.db_query(db,query)
    print("Count:",count)
    exists=count[0][0]
    print(exists)
    
    data=[]
    
    # Based on each case ( if table exists or not, we create student objects)
    # and store them in a list
    if(exists==0):
        print("Creating class")
        for i in range(len(res)):
            print("i:",i)
            student_info=res[i]
            user_id=int(student_info[0])
            all_studentids.append(user_id)
            first_name = str(student_info[1])
            last_name = str(student_info[2])
            item = {"user_id":user_id,"first_name":first_name,"last_name":last_name}
            all_student_objects[user_id]=Student.Stud(user_id,first_name,last_name)
            data.append(item)
           
        #data.append({"dat":stripped_time})
        jsonData=json.dumps(data)    
            
        print(jsonData)
    else:
        print("Table already exists should grab from them")
        query = 'SELECT count(*) from {}'.format(session['table_name'])
        res = du.db_query(db,query)
        print("we have so many student:",res[0][0])
        query = 'SELECT * from {}'.format(session['table_name'])
        res = du.db_query(db,query)
        for i in range(len(res)):
            student_info=res[i]
            user_id=int(student_info[0])
            first_name = str(student_info[1])
            last_name = str(student_info[2])
            pos_x=str(student_info[3])
            pos_y=str(student_info[4])
            item = {"user_id":user_id,"first_name":first_name,"last_name":last_name,"x":pos_x,"y":pos_y}
            all_student_objects[user_id]=Student.Stud(user_id,first_name,last_name)
            all_studentids.append(user_id)
            data.append(item)
            
        #data.append({"dat":stripped_time})    
        jsonData=json.dumps(data)
        
        
            
        
        print("Created objects in python")
        
         
        
        
    #Checking for LIVE or PLAY-BACK VERSION
    chart_version=str(request.form['version'])
    print("Version requested:", chart_version)
    #exit(0)
    if (chart_version == 'live'):
        return render_template('seating_chart_with_names_live.html', jsonData=jsonData)
    else:    
        return render_template('seating_chart_with_names.html', jsonData=jsonData)
    

# Retrieving all the skill builders    
def find_sb():
        db = get_db()
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
        

#Saving the class seating chart into the Database        
@app.route('/saveLayout', methods=['POST'])
def saveLayout():
    db = get_db()
    print("Saved class layout");
    input=request.json;
    print(type(input))
    print(type(input[0]))
    #jsonD=json.dumps(input)
    #print(type(jsonD))    
    for i in range(len(input)):
        print(input[i]['user_id'])
    print("Printing the layout")
    #print(input)
    table=session['table_name']
    print("Table name:",table)
    
    query = 'CREATE TABLE IF NOT EXISTS {}(user_id integer,first_name varchar(60),last_name varchar(60),position_x varchar(10),position_y varchar(10));'.format(table)
    print(query)
    res = du.db_query(db, query)
    count = 'select count(*) from {};'.format(table)
    count=count[0][0]
    print("COUNT")
    print(count)
    type(count)
    #if(count[0][0]>0):
    #    print("Update operation")
    #else:
    for i in range(len(input)):
        uid=input[i]['user_id']
        fname=input[i]['first_name']
        lname=input[i]['last_name']
        x=input[i]['x']
        y=input[i]['y']
        query='INSERT INTO {} (user_id, first_name, last_name,position_x,position_y) VALUES ({},\'{}\',\'{}\',\'{}\',\'{}\');'.format(table,
        uid,fname,lname,x,y)
        print(query)
        res = du.db_query(db, query)
    print("DONE Inserting")
        
    return render_template('seating_chart.html');
    
    
    
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
        db.close()
        return source['data'][np.argwhere([time-offset < i <= time for i in source['data'][:, -1]]).ravel(), :-1],\
               source['headers']


#To query actions from Assistments 2.0 Database               
def get_actions_from_db2(db,source=None):
    _vars,_query=du.read_var_text_file(SQL_FOLDER+'live_chart_2_test_modified_id.sql',sep='\n')
    print("QUERY READING:",_query)
    res,headers=du.db_query(db,_query,None,return_column_names=True) 
    print("RES:",res)
    
''' 
#Background test for socket  io              
def background_stuff():
    """ Let's do it a bit cleaner """
    print("Thread started")
    #while True:
    #time.sleep(1)
    #t = str(time.clock())
    #print("Going to emit message from python");
    #socketio.emit('message', {'data': 'This is data', 'time': t}, namespace='/test')
    #global db
    db = connect_db()

    date = '2018-06-08 8:30:00'
    class_section = 96680
    time = earliest_action_time(db, date, class_section)
    time_s = time_to_seconds(db, date)  # time_to_seconds(db,time)

    action_history = get_all_actions(db, date, class_section)

    increment = 1
    speed = 1 #30
    while True:
        res, headers = get_recent_actions(db, date, class_section, time_s, increment, source=action_history)
        for i in res:
            msg = 'user {} :: {}'.format(i[3],i[8])
            print("Emitting msg")
            socketio.emit('message', {'data': 'This is data', 'message_sent': msg}, namespace='/test')
            print('{}: {}'.format(str(i[16]), msg))
        time_s += increment
        sleep(increment / speed)
        
@app.route('/background_process_test')
def background_process_test():
    print("Background process tested")
    global thread
    
    if thread is None:
        thread = Thread(target=background_stuff)
        thread.start()

        

'''
#Function which handles the data being sent to front end.
#Starting point for live chart events

def background_update_layout():
    global input
    #msg="Happy"+str(input)
    #socketio.emit('message', {'data': 'This is data', 'message_sent': msg}, namespace='/test')
    
    print("Thread started")
    
    #while True:
    #time.sleep(1)
    #t = str(time.clock())
    #print("Going to emit message from python");
    #socketio.emit('message', {'data': 'This is data', 'time': t}, namespace='/test')
    
    
    #Trying to connect to DB2
    
    #print("Trying to see if db2 is connected") 
    #db2=connect_db_2()
    #res2=get_actions_from_db2(db2)
    
    global db
    print("Using global db")
    #db = connect_db() using global db

    #date = '2018-06-08 8:30:00'
    date=input
    #class_section = 96680
    class_section=section_
    time = earliest_action_time(db, date, class_section)
    time_s = time_to_seconds(db, date)  # time_to_seconds(db,time)

    action_history = get_all_actions(db, date, class_section)

    increment = 1
    speed = 1#30 changing to 1
    if(len(skill_builders)==0):
            find_sb()         #needed to check if they are working on SB
    
    while True:
        
        #res, headers = get_recent_actions(db, date, class_section, time_s, increment, source=action_history)
        res, headers = get_recent_actions(db, date, class_section, time_s, increment, source=None)
        print("Querying for timess:",time_s,t2.strftime('%H:%M:%S', t2.gmtime(time_s)),date)
        
        #sleep(2)
        #student_learning=[]
        #learning=[]
        #done=[]
        #bad_learning=[]
        for i in res:
            print(i)
            data=[]  # Carries the data to send to front-end
            student_learning=[] # Stores students in learning state
            learning=[] # Stores students in learning state
            done=[] # Stores students who are done learning (3 right)
            bad_learning=[] # Stores students in bad learning state
            
            student_id=i[3]
            action=i[8]
            date_time=str(i[16])
            assignment_id=i[2]
            print("ASSIGNMENT ID:",assignment_id,type(assignment_id))
            print("SKBuilder:",skill_builders[0],type(skill_builders[0]))
            #exit(0)
            
            problem_log_id=i[1]
            correct=i[9]
            if(student_id in all_studentids):
                item={"date":date_time,"student_id":student_id,"action":action}
                data.append(item)
                dt=datetime.datetime.now()
                all_student_objects[student_id].action_list.append(action)
                all_student_objects[student_id].action_time.append(dt)
        
            check_timer=1
            if(action=='answer'):
                #if(assignment_id not in skill_builders):         #Commenting to make it work for any assignment
                #    print("Student solving a SKILL BUILDER assignment")
                    
                    assignment_dicts=all_student_objects[student_id].assignment_id
                    assignment_list=list(assignment_dicts.keys())
                    
                    if(assignment_id in assignment_list):
                        if (problem_log_id not in all_student_objects[student_id].assignment_id[assignment_id]):
                            all_student_objects[student_id].assignment_id[assignment_id].append(problem_log_id)
                            all_student_objects[student_id].correctness[assignment_id].append(correct)
                    
                    else:
                        all_student_objects[student_id].assignment_id[assignment_id]=[]
                        all_student_objects[student_id].assignment_id[assignment_id].append(problem_log_id)
                        all_student_objects[student_id].correctness[assignment_id]=[]
                        all_student_objects[student_id].correctness[assignment_id].append(correct)
                        
                        
                    stud=all_student_objects[student_id]
                    learn_status=stud.check_learning(assignment_id)
                   
                    print("LEARN STATUS:",learn_status)
                    if(learn_status==0):
                        pass
                    elif(learn_status==1):
                        learning.append(student_id)
                        check_timer=0
                        sleep(2)
                        #exit(0)
                    elif(learn_status==2):
                        done.append(student_id)
                        check_timer=0
                        sleep(2)
                        #exit(0)
                    elif(learn_status==3):
                        bad_learning.append(student_id)
                        check_timer=0
                        sleep(2)
                        #exit(0)
                #sleep(15)    
                    
                        
                    
                
                        
        
            print("\nAppending data:",data)
            print("\n")
            idle=[]
            timer=[]
            
            
            #print("\n Printing student objects")
            
            
            #Checking for idle students
            for s in all_studentids:
        
                s_obj=all_student_objects[s]
                #s_obj.getStud()
                if(s_obj.isIdle()):
                    idle.append(s_obj.getId())
                if(check_timer==1):
                    if(s_obj.timer_mgr()):
                        timer.append(s_obj.getId())
                
            idle_students={"idle":idle} 
            timer_students={"timer":timer}
            data.append(timer_students)#-5
            data.append(idle_students) #-4
            learning_students={"learning":learning}
            done_students={"done":done}
            bad_learning_students={"bad_learning":bad_learning}
            data.append(learning_students)     #-3
            data.append(bad_learning_students) #-2
            data.append(done_students) #-1
            
            print("DATA before sending as json dumps")
            print(json.dumps(data))
            msg=str(json.dumps(data))
        
                        
            #msg = 'user {} :: {}'.format(i[3],i[8])
            print("Emitting msg")
            socketio.emit('message', {'data': 'This is data', 'message_sent': msg}, namespace='/test')
            print('{}: {}'.format(str(i[16]), msg))
            
        time_s += increment
        sleep(increment / speed)
        
    
'''   
def background_update_layout2():
    global input
    #msg="Happy now?"+str(input)
    #socketio.emit('message', {'data': 'This is data', 'message_sent': msg}, namespace='/test')
    print("Thread started")
    #while True:
    #time.sleep(1)
    #t = str(time.clock())
    #print("Going to emit message from python");
    #socketio.emit('message', {'data': 'This is data', 'time': t}, namespace='/test')
    db = connect_db()

    #date = '2018-06-08 8:30:00'
    date=input
    #class_section = 96680
    class_section=section_
    time = earliest_action_time(db, date, class_section)
    time_s = time_to_seconds(db, date)  # time_to_seconds(db,time)

    action_history = get_all_actions(db, date, class_section)

    increment = 1
    speed = 30
    """
    while True:
        res, headers = get_recent_actions(db, date, class_section, time_s, increment, source=action_history)
        for i in res:
            msg = 'user {} :: {}'.format(i[3],i[8])
            print("Emitting msg")
            socketio.emit('message', {'data': 'This is data', 'message_sent': msg}, namespace='/test')
            print('{}: {}'.format(str(i[16]), msg))
        time_s += increment
        sleep(increment / speed)
        
    """
    
    #date = '2018-06-08 8:30:00'
    #date=input[0]
    #class_section = 96681 
    print(type(section_))
    print(type(class_section))
    print("Class_time:",class_time)
    print(type(class_time))
    print("Actual date:",date)
    
    stripped_time=datetime.datetime.strptime(class_time, '%Y-%m-%d'+'T'+'%H:%M')
    print("stripped_time:",stripped_time)
    stripped_time = stripped_time + datetime.timedelta(milliseconds=1)
    stripped_time=stripped_time.strftime("%Y-%m-%d %H:%M:%S.%f")
    
    print("stripped_time + 1:",stripped_time)
    #exit(0)
    
    
    
    if(len(skill_builders)==0):
            find_sb()
            #exit(0)
    action_history = get_all_actions(db, date, class_section)

    increment = 1
    speed = 30
    counter=0
    #while True:
    diff=datetime.timedelta(seconds=1)
    #date_time_obj = datetime.datetime.strptime(input[0], '%Y-%m-%d %H:%M:%S.%f')
    new_date_time_obj=date_time_obj+diff
    print("New date to query:",new_date_time_obj.strftime("%Y-%m-%d %H:%M:%S.%f"))
    date2=new_date_time_obj.strftime("%Y-%m-%d %H:%M:%S.%f")
    
    print("All student ids")
    print(all_studentids)
    print("Date:",date2)
    
    
    #replacing date2 to stripped time
    time = earliest_action_time(db, date2, class_section)
    time_s = time_to_seconds(db, date2)  # time_to_seconds(db,time)
    #sleep(5)
    
    #time = earliest_action_time(db, stripped_time, class_section)
    #time_s = time_to_seconds(db, stripped_time)  # time_to_seconds(db,time)
    #diff=datetime.timedelta(seconds=1)
    #new_date_time_obj=date_time_obj+diff
    #sleep(5)
    
    while True:
        #print("entering true loop")
        
        res, headers = get_recent_actions(db, date2, class_section, time_s, increment, source=action_history)
        #res, headers = get_recent_actions(db, date2, class_section, time_s, increment)
        print("RES:",len(res))
        print(time_s)
        student_learning=[]
        
        for i in res:
            data=[]
            student_learning=[]
            learning=[]
            done=[]
            bad_learning=[]
            d=datetime.datetime.strptime(str(i[16]), '%Y-%m-%d %H:%M:%S.%f')
            print("D=",d)
            print("new_date=",new_date_time_obj)
            msg = 'user {} :: {}'.format(i[3],i[8])
            print('{}: {}'.format(str(i[16]), msg))
            print("CORRECTNESS:",i[9],"Type:", type(i[9]))
            
            
                
            student_id=i[3]
            action=i[8]
            date_time=str(i[16])
            assignment_id=i[2]
            print("ASSIGNMENT ID:",assignment_id,type(assignment_id))
            print("SKBuilder:",skill_builders[0],type(skill_builders[0]))
            #exit(0)
            problem_log_id=i[1]
            correct=i[9]
            if(student_id in all_studentids):
                item={"date":date_time,"student_id":student_id,"action":action}
                data.append(item)
                dt=datetime.datetime.now()
                all_student_objects[student_id].action_list.append(action)
                all_student_objects[student_id].action_time.append(dt)
                #Checking if a question ended and then if it is a skill builder, then check if learning occurrs
                #
                check_timer=1
                if(action=='answer'):
                    if(assignment_id not in skill_builders):
                        print("Student solving a SKILL BUILDER assignment")
                        
                        assignment_dicts=all_student_objects[student_id].assignment_id
                        assignment_list=list(assignment_dicts.keys())
                        
                        if(assignment_id in assignment_list):
                            if (problem_log_id not in all_student_objects[student_id].assignment_id[assignment_id]):
                                all_student_objects[student_id].assignment_id[assignment_id].append(problem_log_id)
                                all_student_objects[student_id].correctness[assignment_id].append(correct)
                        
                        else:
                            all_student_objects[student_id].assignment_id[assignment_id]=[]
                            all_student_objects[student_id].assignment_id[assignment_id].append(problem_log_id)
                            all_student_objects[student_id].correctness[assignment_id]=[]
                            all_student_objects[student_id].correctness[assignment_id].append(correct)
                            
                            
                        stud=all_student_objects[student_id]
                        learn_status=stud.check_learning(assignment_id)
                       
                        print("LEARN STATUS:",learn_status)
                        if(learn_status==0):
                            pass
                        elif(learn_status==1):
                            learning.append(student_id)
                            check_timer=0
                            sleep(2)
                            #exit(0)
                        elif(learn_status==2):
                            done.append(student_id)
                            check_timer=0
                            sleep(2)
                            #exit(0)
                        elif(learn_status==3):
                            bad_learning.append(student_id)
                            check_timer=0
                            sleep(2)
                            #exit(0)
                    #sleep(15)    
                        
                            
                        
                    
                            
            
                print("\nAppending data:",data)
                print("\n")
                idle=[]
                timer=[]
                
                
                print("\n Printing student objects")
                
                for s in all_studentids:
            
                    s_obj=all_student_objects[s]
                    #s_obj.getStud()
                    if(s_obj.isIdle()):
                        idle.append(s_obj.getId())
                    if(check_timer==1):
                        if(s_obj.timer_mgr()):
                            timer.append(s_obj.getId())
                    
                idle_students={"idle":idle} 
                timer_students={"timer":timer}
                data.append(timer_students)#-5
                data.append(idle_students) #-4
                learning_students={"learning":learning}
                done_students={"done":done}
                bad_learning_students={"bad_learning":bad_learning}
                data.append(learning_students)     #-3
                data.append(bad_learning_students) #-2
                data.append(done_students) #-1
                
                print("DATA before sending as json dumps")
                print(json.dumps(data))
                msg=str(json.dumps(data))
                socketio.emit('message', {'data': 'This is data', 'message_sent': msg}, namespace='/test')
                #return json.dumps(data)
            else:
                print("\nStudent not in this class")
         
            
                
                    
                
        time_s += increment
        sleep(increment / speed)
   
    #End of function
    
    
    
    
 '''   
    
    
    
#starts the thread to query and send data. 

@socketio.on('message', namespace='/test')
def talking(date):
    print("HELLO")
    #socketio.emit('message', {'data': 'This is data', 'message_sent': 'yayyy we spoke!'+date}, namespace='/test')
    print("Background process tested from class log")
    global thread
    global input
    global speed
    input = date[0]
    speed = date[1]
    print("INPUT:", input ,"SPEED:",speed)
    if thread is None:
        thread = Thread(target=background_update_layout)
        thread.start()
        
    

    
'''    
   
@app.route('/class_log', methods=['POST'])
def class_log():
    print("Inside CLASS_LOG")
    global input
    db = connect_db()
    input=request.json
    print("Class log request:",input)
    print(type(input))
    #
    print("Background process tested from class log")
    global thread
    
    if thread is None:
        thread = Thread(target=background_update_layout)
        thread.start()
        
    return ""
#def background_update_layout():
#    msg="Happy now?"
#    socketio.emit('message', {'data': 'This is data', 'message_sent': msg}, namespace='/test')
    
    """ starting comment to test
    
    #date = '2018-06-08 8:30:00'
    date=input[0]
    class_section = 96681 
    print(type(section_))
    print(type(class_section))
    print("Class_time:",class_time)
    print(type(class_time))
    print("Actual date:",date)
    
    stripped_time=datetime.datetime.strptime(class_time, '%Y-%m-%d'+'T'+'%H:%M')
    print("stripped_time:",stripped_time)
    stripped_time = stripped_time + datetime.timedelta(milliseconds=1)
    stripped_time=stripped_time.strftime("%Y-%m-%d %H:%M:%S.%f")
    
    print("stripped_time + 1:",stripped_time)
    #exit(0)
    
    
    
    if(len(skill_builders)==0):
            find_sb()
            #exit(0)
    action_history = get_all_actions(db, date, class_section)

    increment = 1
    speed = 30
    counter=0
    #while True:
    diff=datetime.timedelta(seconds=1)
    date_time_obj = datetime.datetime.strptime(input[0], '%Y-%m-%d %H:%M:%S.%f')
    new_date_time_obj=date_time_obj+diff
    print("New date to query:",new_date_time_obj.strftime("%Y-%m-%d %H:%M:%S.%f"))
    date2=new_date_time_obj.strftime("%Y-%m-%d %H:%M:%S.%f")
    data=[]
    print("All student ids")
    print(all_studentids)
    print("Date:",date2)
    
    
    #replacing date2 to stripped time
    time = earliest_action_time(db, date2, class_section)
    time_s = time_to_seconds(db, date2)  # time_to_seconds(db,time)
    #sleep(5)
    
    #time = earliest_action_time(db, stripped_time, class_section)
    #time_s = time_to_seconds(db, stripped_time)  # time_to_seconds(db,time)
    #diff=datetime.timedelta(seconds=1)
    #new_date_time_obj=date_time_obj+diff
    #sleep(5)
    
    while True:
        #print("entering true loop")
        res, headers = get_recent_actions(db, date2, class_section, time_s, increment, source=action_history)
        #res, headers = get_recent_actions(db, date2, class_section, time_s, increment)
        print("RES:",len(res))
        print(time_s)
        student_learning=[]
        learning=[]
        done=[]
        bad_learning=[]
        for i in res:
            d=datetime.datetime.strptime(str(i[16]), '%Y-%m-%d %H:%M:%S.%f')
            print("D=",d)
            print("new_date=",new_date_time_obj)
            msg = 'user {} :: {}'.format(i[3],i[8])
            print('{}: {}'.format(str(i[16]), msg))
            print("CORRECTNESS:",i[9],"Type:", type(i[9]))
            
            
                
            student_id=i[3]
            action=i[8]
            date_time=str(i[16])
            assignment_id=i[2]
            print("ASSIGNMENT ID:",assignment_id,type(assignment_id))
            print("SKBuilder:",skill_builders[0],type(skill_builders[0]))
            #exit(0)
            problem_log_id=i[1]
            correct=i[9]
            if(student_id in all_studentids):
                item={"date":date_time,"student_id":student_id,"action":action}
                data.append(item)
                dt=datetime.datetime.now()
                all_student_objects[student_id].action_list.append(action)
                all_student_objects[student_id].action_time.append(dt)
                #Checking if a question ended and then if it is a skill builder, then check if learning occurrs
                #
                check_timer=1
                if(action=='answer'):
                    if(assignment_id not in skill_builders):
                        print("Student solving a SKILL BUILDER assignment")
                        
                        assignment_dicts=all_student_objects[student_id].assignment_id
                        assignment_list=list(assignment_dicts.keys())
                        
                        if(assignment_id in assignment_list):
                            if (problem_log_id not in all_student_objects[student_id].assignment_id[assignment_id]):
                                all_student_objects[student_id].assignment_id[assignment_id].append(problem_log_id)
                                all_student_objects[student_id].correctness[assignment_id].append(correct)
                        
                        else:
                            all_student_objects[student_id].assignment_id[assignment_id]=[]
                            all_student_objects[student_id].assignment_id[assignment_id].append(problem_log_id)
                            all_student_objects[student_id].correctness[assignment_id]=[]
                            all_student_objects[student_id].correctness[assignment_id].append(correct)
                            
                            
                        stud=all_student_objects[student_id]
                        learn_status=stud.check_learning(assignment_id)
                       
                        print("LEARN STATUS:",learn_status)
                        if(learn_status==0):
                            pass
                        elif(learn_status==1):
                            learning.append(student_id)
                            check_timer=0
                            sleep(2)
                            #exit(0)
                        elif(learn_status==2):
                            done.append(student_id)
                            check_timer=0
                            sleep(2)
                            #exit(0)
                        elif(learn_status==3):
                            bad_learning.append(student_id)
                            check_timer=0
                            sleep(2)
                            #exit(0)
                    #sleep(15)    
                        
                            
                        
                    
                            
            
                print("\nAppending data:",data)
                print("\n")
                idle=[]
                timer=[]
                
                
                print("\n Printing student objects")
                
                for s in all_studentids:
            
                    s_obj=all_student_objects[s]
                    #s_obj.getStud()
                    if(s_obj.isIdle()):
                        idle.append(s_obj.getId())
                    if(check_timer==1):
                        if(s_obj.timer_mgr()):
                            timer.append(s_obj.getId())
                    
                idle_students={"idle":idle} 
                timer_students={"timer":timer}
                data.append(timer_students)#-5
                data.append(idle_students) #-4
                learning_students={"learning":learning}
                done_students={"done":done}
                bad_learning_students={"bad_learning":bad_learning}
                data.append(learning_students)     #-3
                data.append(bad_learning_students) #-2
                data.append(done_students) #-1
                
                print("DATA before sending as json dumps")
                print(json.dumps(data))
                
                return json.dumps(data)
            else:
                print("\nStudent not in this class")
         
            
                
                    
                
        time_s += increment
        sleep(increment / speed)
        counter=counter+1
        print("TIME_S,INCREMENTING COUNTER")
    return "Hii"
    """ #ending test
'''   
db = connect_db() 
if __name__ == '__main__':
    app.run(threaded=True, debug=False, host='0.0.0.0',port=8081)
    
    