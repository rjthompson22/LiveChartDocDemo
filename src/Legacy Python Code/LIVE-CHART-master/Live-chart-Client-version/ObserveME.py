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
from datetime import datetime
from sklearn.metrics import f1_score,cohen_kappa_score

app = Flask(__name__)
app_args = du.read_paired_data_file(os.path.dirname(os.path.abspath(__file__))+'\config.txt')
app.secret_key = app_args['secret_key']
db = None


def connect_db():
    db = du.db_connect(app_args['db_name'], app_args['username'], app_args['password'],
                       host=app_args['host'], port=app_args['port'])
    return db

def get_db():
    if not hasattr(g, 'db'):
        g.db = connect_db()
    return g.db

@app.route('/')
def root():
    msg = ''
    # Display indicator message if available
    if 'message' in session:
        msg = session['message']
        session['message'] = ''
    # Render login page
    return render_template('index.html', message=msg)


@app.route('/register', methods=['GET'])
def registration_landing():
    # render registration page
    return render_template('register.html')


@app.route('/register', methods=['POST'])
def register():
    # get database handle
    db = get_db()

    # check to see if the user already exists using the entered email address
    query = 'SELECT * FROM users WHERE email=\'{}\';'.format(request.form['Email'])
    res = du.db_query(db, query)
    if len(res) > 0:
        # redirect to login page with message if user is found
        session['message'] = 'A user with that email is already registered!'
        return redirect('/')

    # if not found, generate encrypted password and salt and add entry to the database
    password, salt = du.get_salted(request.form['password'])
    query = 'INSERT INTO users (email, encrypted_password, salt) VALUES (\'{}\',\'{}\',\'{}\');'.format(
        request.form['Email'], password, salt)
    if du.db_query(db,query) is None:
        session['message'] = 'Oops! We are unable to connect to the database.'
    else:
        # check to ensure that the user was added
        query = 'SELECT * FROM users WHERE email=\'{}\';'.format(request.form['Email'])
        res = du.db_query(db, query)
        if len(res) == 0:
            # if the user is not found, redirect to login page with message
            session['message'] = 'Oops! Something went wrong trying to register your account.'
            redirect('/')
        else:
            session['message'] = 'You are now registered!'

        # add associated user details to database (low priority, no additional check made)
        query = 'INSERT INTO user_details (user_id, first_name, middle_initial, last_name) VALUES ' \
                '({},\'{}\',\'{}\',\'{}\');'.format(res[0][0], request.form['fname'], request.form['mi'],
                                                    request.form['lname'])
        du.db_query(db, query)

    # return to the login page
    return redirect('/')


@app.route('/login', methods=['POST'])
def login():
    # get database handle
    db = get_db()

    # search database for the user
    query = 'SELECT * FROM users WHERE email=\'{}\';'.format(request.form['Email'])
    res = du.db_query(db, query)

    if len(res) == 0:
        # user was not found
        session['message'] = 'Incorrect email or password!'
    else:
        # user was found, check password against encoded password and salt
        enc = res[0][2]
        salt = res[0][3]
        matching = du.compare_salted(request.form['lg_password'],enc,salt)
        if not matching:
            # password did not match
            session['message'] = 'Incorrect email or password!'
        else:
            # proceed with login - get user details from database
            # TODO: check that user_details entry exists and fill with default values if not found
            query = 'SELECT * FROM user_details WHERE user_id = {};'.format(res[0][0])
            detail = du.db_query(db, query)
            session['fname'] = detail[0][2]
            session['mi'] = detail[0][3]
            session['lname'] = detail[0][4]

            # session object is persistent - existence of email and user indicate user is logged in
            # TODO: add login timestamp to session object to implement login expiration
            session['email'] = res[0][1]
            session['user'] = res[0][0]

            session['message'] = 'Welcome ' + detail[0][2] + '!'

    # attempt to go to dashboard (will redirect to root if unsuccessful login)
    return redirect('/dashboard')


@app.route('/dashboard', methods=['GET'])
def dashboard():
    # TODO: display recent sessions
    # TODO: add new 'session info' page to display inforamtion and stats on recent sessions

    # if the user information is not in the session object, redirect to root
    if not ('email' in session and len(session['email']) > 0):
        session['message'] = 'You must be logged in to view the dashboard!'
        return redirect('/')

    # clean leftover syncing requests from previous sessions
    db = get_db()
    query = 'DELETE FROM syncing WHERE coder_user_id={};'.format(session['user'])
    du.db_query(db, query)

    # display message if available
    msg = ''
    if 'message' in session:
        msg = session['message']
        session['message'] = ''

    # render dashboard page
    return render_template('dashboard.html', message=msg)


@app.route('/addclass', methods=['GET'])
def add_class_landing():
    # ensure user is logged in and redirect if not
    if 'user' not in session:
        return redirect('/dashboard')

    # get database handle
    db = get_db()

    # find the last unfinished class entry from the current user and use this if found
    query = 'SELECT * FROM classrooms WHERE code IS NULL AND creator_user_id = {};'.format(session['user'])
    res = du.db_query(db, query)

    if len(res) == 0:
        # no unfinished logs were found, create a new log
        query = 'INSERT INTO classrooms (creator_user_id) VALUES ({});'.format(session['user'])
        du.db_query(db, query)

        # select the newly added row (id will be used for class code)
        query = 'SELECT * FROM classrooms WHERE code IS NULL AND creator_user_id = {};'.format(session['user'])
        res = du.db_query(db, query)

    # generate the class code: simply 'CL' followed by the hex of row id from the classrooms table
    code =  'CL' + hex(res[0][0])[2:]

    # render class creation page
    return render_template('addclass.html', code=code)


@app.route('/addclass', methods=['POST'])
def add_class():
    # get database handle
    db = get_db()

    # get the class id from the generated class code
    class_id = int('0x' + request.form['cl_code'][2:], 0)

    # update the row with the form information
    query = 'UPDATE classrooms SET teacher_name=\'{}\', class_name=\'{}\', grade=\'{}\',subject=\'{}\',n_students={},' \
            'code=\'{}\', created_at=now() WHERE id = {};'.format(request.form['teacher'], request.form['classname'],
                                                                  request.form['grade'], request.form['subject'],
                                                                  request.form['nstudents'], request.form['cl_code'],
                                                                  class_id)
    du.db_query(db, query)

    # return to the dashboard and display the created class code for user feedback and reference
    session['message'] = 'Class "{}" has been created!'.format(request.form['cl_code'])
    return redirect('/dashboard')
@app.route('/force_start_sync_call', methods=['GET'])
def force_start_sync_call():
    args=dict()
    db = get_db()
    print("I AM IN FORCE SYNC CALL")
    query='SELECT coder_user_id from sync_session_records where session_id={} and ready=\'{}\';'.format(session['coding_session'],'no')
    res = du.db_query(db, query)
    not_ready_users=[]
    for i in range(len(res)):
        t=res[i]
        print(t[0])
        not_ready_users.append(t[0])
    args['not_ready_users']= not_ready_users
    s=session['coding_session']
    
    query='DELETE from sync_session_records where session_id={} and ready=\'{}\' and role={};'.format(session['coding_session'],'no',2)
    du.db_query(db, query)
    for i in not_ready_users:
        query='INSERT INTO kicked_out (coder_user_id,session_id) ' \
                    'VALUES ({},{});'.format(i, session['coding_session'])
        du.db_query(db, query)
    print("Finished kicking out")
    args['action'] = '2'  # syncing
    args['class_id'] = session['class_code']
    args['student_id'] = session['current']
    args['role']=1        
    print(args)
    return render_template('session.html', args=args)    
@app.route('/timestamp',methods=['GET'])
def timestamp():
    args=dict()
    print("IN TIMESTAMP")
    #t=datetime.now()
    t='timestamp with time zone \'' + str(datetime.now()) + '\''
    session['time']=t
    args['action'] = '13'  # syncing
    args['class_id'] = session['class_code']
    args['student_id'] = session['current']
    args['role']=session['role']
    
    print(t)
    print(args)
    #return 'some response'
    return render_template('session.html', args=args) 
@app.route('/start',methods=['GET'])
def start():
    args=dict()
    db = get_db()
    print("IN START FUNCTION")
    if 'action2' in request.args:
        print("printing args")
        print(request.args)
        if request.args['action2'] == '2':
            print("action 2")
            role=session['role']
            if (role == 1):
                print("IN  LEAVE FUNCTION")
                query='UPDATE syncing1 set started_sync=\'{}\',aborted=\'{}\' where coding_session_id={};'.format('yes','yes',session['coding_session']);
                du.db_query(db, query)
                args['role']=1
                args['action']='11'
                print("Role 1 done from leave")
                
            if(role == 2):
                print("In leave function role 2")
                query='DELETE from sync_session_records where session_id={}  and role={};'.format(session['coding_session'],2)
                du.db_query(db, query)
                print("role 2 done leaving")
                args['action']='11'
                args['role']=2
            args['class_id'] = session['class_code']

            args['student_id'] = session['current']    
            print(args)
            return render_template('session.html', args=args)
    
        if request.args['action2']=='1':
    
            query='UPDATE syncing1 set started_sync=\'{}\' where coding_session_id={};'.format('yes',session['coding_session']);
            du.db_query(db, query)
            ready_users=[]
            
            
            
            query='SELECT coder_user_id from sync_session_records where session_id={} and ready=\'{}\';'.format(session['coding_session'],'yes')
            res = du.db_query(db, query)
            
            print("Select coder id result")
            print(res)
            for i in range(len(res)):
                t=res[i]
                print(t[0])
                query1='select first_name from user_details where user_id={};'.format(t[0])
                names=du.db_query(db,query1)
                ready_users.append(names[0][0])
            args['ready_users'] = ready_users
            print("Ready USers:",ready_users)
            args['class_id'] = session['class_code']
            args['role']=session['role']
            args['student_id'] = session['current']
            args['action']='2'
                # render session page in 'waiting' state
            return render_template('session.html', args=args)
    
@app.route('/leave',methods=['GET'])
def leave():
    db = get_db()
    args=dict()
    role=session['role']
    if (role == 1):
        print("IN LEAVE FUNCTION")
        query='UPDATE syncing1 set started_sync=\'{}\' where coding_session_id={};'.format('yes',session['coding_session']);
        du.db_query(db, query)
        args['role']=1
        args['action']='11'
        print("Role 1 done from leave")
        
    if(role == 2):
        print("In leave function role 2")
        query='DELETE from sync_session_records where session_id={}  and role={};'.format(session['coding_session'],2)
        du.db_query(db, query)
        print("role 2 done leaving")
        args['action']='11'
        args['role']=2
    args['class_id'] = session['class_code']
    
    args['student_id'] = session['current']    
    print(args)
    return render_template('session.html', args=args)
      
    
    
    
@app.route('/start_sync_call', methods=['GET'])
def sync_sesion():
    db = get_db()
    for i in range(0,2):
        c=session['user']
        print("I am user:",c)
        s=session['coding_session']
        print("Role:",session['role'])
        
        print("I am in session:",s)
    args=dict()
    args['action'] = '11'  # waiting
    args['class_id'] = session['class_code']
    args['role']=session['role']
    args['student_id'] = session['current']
    # render session page in 'waiting' state
    coder_id=session['user']
    session_id=session['coding_session']
    
    query='SELECT started_sync from syncing1 where coding_session_id={};'.format(session_id)
    res=du.db_query(db,query)
    print("Result for started_sync:",res)
    if(res[0][0]=='yes'):
        
        args['action'] = '5'  # syncing
        
        
        print(args)
        return render_template('session.html', args=args)
    
    print("IN START SYNC CALL FUNCTION")
    print("printing args")
    if 'action1' in request.args:
        print(request.args)
        if request.args['action1'] == '2':
            print("action 2")
            role=session['role']
            if (role == 1):
                print("IN LEAVE FUNCTION")
                query='UPDATE syncing1 set started_sync=\'{}\' where coding_session_id={};'.format('yes',session['coding_session']);
                du.db_query(db, query)
                args['role']=1
                args['action']='11'
                print("Role 1 done from leave")
                
            if(role == 2):
                print("In leave function role 2")
                query='DELETE from sync_session_records where session_id={}  and role={} and coder_user_id={};'.format(session['coding_session'],2,session['user'])
                du.db_query(db, query)
                print("role 2 done leaving")
                args['action']='11'
                args['role']=2
            args['class_id'] = session['class_code']

            args['student_id'] = session['current']    
            print(args)
            return render_template('session.html', args=args)
    if (session['role']==1):
        
        query='UPDATE sync_session_records SET ready=\'{}\' WHERE coder_user_id={} and session_id={} and role={} ;'.format('yes',coder_id,session_id,1)
        du.db_query(db,query) 
        print("Updated for role 1 yes")
        
        args['class_id'] = session['class_code']
        args['student_id'] = session['current']
        ready_users=[]
        query='SELECT coder_user_id from sync_session_records where session_id={} and ready=\'{}\';'.format(session_id,'yes')
        res = du.db_query(db, query)
        print("Select coder id result")
        print(res)
        for i in range(len(res)):
            t=res[i]
            print(t[0])
            query1='select first_name from user_details where user_id={};'.format(t[0])
            names=du.db_query(db,query1)
            ready_users.append(names[0][0])
        args['ready_users'] = ready_users
        print("Ready USers:",ready_users)
        
        args['action']='2'
            # render session page in 'waiting' state
        return render_template('session.html', args=args)
    
    
    if (session['role']==2):
        query='UPDATE sync_session_records SET ready=\'{}\' WHERE coder_user_id={} and session_id={} ;'.format('yes',coder_id,session_id)
        du.db_query(db,query)
        query='select student_id,class_id from sync_session_records  WHERE session_id={} and role={} ;'.format(session_id,1)
        res=du.db_query(db,query)
        query2='UPDATE sync_session_records SET student_id={} WHERE coder_user_id={} and session_id={} ;'.format(res[0][0],coder_id,session_id)
        du.db_query(db,query2)
        args['student_id']=res[0][0]
        args['class_id']=res[0][1]
        session['current']=res[0][0]
       
        query = 'SELECT coder_user_id FROM sync_session_records WHERE session_id = {} and ready=\'no\';'.format(session['coding_session'])
        res = du.db_query(db, query)
        ready_users=[]
        query='SELECT coder_user_id from sync_session_records where session_id={} and ready=\'{}\';'.format(session_id,'yes')
        res = du.db_query(db, query)
        print("Select coder id result")
        print(res)
        for i in range(len(res)):
            t=res[i]
            print(t[0])
            query1='select first_name from user_details where user_id={};'.format(t[0])
            names=du.db_query(db,query1)
            ready_users.append(names[0][0])
        args['ready_users'] = ready_users
        print("Ready USers:",ready_users)
        
        args['action']='2'
            # render session page in 'waiting' state
        return render_template('session.html', args=args)
        
        
            
    
"""    
def default_args_setter_helper(args):
    if 'all_ready' not in args:
        args['all_ready']='default'
    
    if 'update' not in args:
        args['update']='default'
    
    return args
    """
@app.route('/ready_update_db')
def ready_update_db():
    args=dict()
    db = get_db()
    for i in range(0,1):
        print("I AM in ready_update_db")
        print("Role:",session['role'])
        print("I am User:",session['user'])
        print("Coding session:",session['coding_session'])
    
    role=session['role']
    coder_id=session['user']
    session_id=session['coding_session']
    query='select coder_user_id from kicked_out where session_id={}'.format(session_id)
    res=du.db_query(db,query)
    kicked_out=[]
    for i in range(len(res)):
        t=res[i]
        print(t[0])
        kicked_out.append(t[0])
        
    #Checking if the coder has to be kicked out of the sync session
    if coder_id in kicked_out:
        print("YOU GOT KICKED OUT:",coder_id)
        args['action']='11'
        args['student_id'] = session['current']
        args['class_id']=session['class_code']
        args['role']=session['role']
        
        return render_template('session.html', args=args)
        
    if(session['role']==2):
        print("Updating db for ready=yes")
        query='UPDATE sync_session_records SET ready=\'{}\' WHERE coder_user_id={} and session_id={} ;'.format('yes',coder_id,session_id)
        du.db_query(db,query)
        query='select student_id,class_id from sync_session_records  WHERE session_id={} and role={} ;'.format(session_id,1)
        res=du.db_query(db,query)
        query2='UPDATE sync_session_records SET student_id={} WHERE coder_user_id={} and session_id={} ;'.format(res[0][0],coder_id,session_id)
        du.db_query(db,query2)
        args['student_id']=res[0][0]
        args['class_id']=res[0][1]
        print("Done update, going to redirect to /start_sync_call")
        args['action'] = '2'
        #args['update'] = 'success'
        args['role']=session['role']
        return render_template('session.html', args=args)
            
        
    else:
        print("Something wrong!no other role can be calling this funciton")
        args['action']= '15'
        #args['update']='failed'
    
        # waiting
        #Tell update done
        #args=default_args_setter_helper(args)
        return render_template('session2.html', args=args)
    

@app.route('/session', methods=['GET'])
def session_landing():
    """
    session_landing handles all state changes within the session, including syncing and timer initialization
    """
    # TODO: reformulate 'session' conceptual object and add database table to log coders joining a session
    # TODO: rewrite syncing functionality (currently relies on page refresh to search for second coder)
    # TODO: add parameter for timer duration
    # TODO: add timer duration to coding_logs table in database
    # TODO: allow user to define timer duration
    # TODO: include measure of kappa for the current session (default as hidden, but allow expandable)
    print("IN SESSION GET")
    if 'user' not in session:
        return redirect('/dashboard')

    if 'class_code' not in request.args:
        return redirect('/dashboard')

    args = dict()
    db = get_db()

    # TODO: ensure user is signed in before beginning session

    # get class information (code, number of students, etc)
    session['class_code'] = str(request.args.get('class_code')).upper()
    query = 'SELECT * FROM classrooms WHERE code = \'{}\';'.format(session['class_code'])
    res = du.db_query(db, query)

    if len(res) == 0:
        # if the class is not found, return to the dashboard
        session['message'] = 'The class "{}" does not exist!'.format(session['class_code'])
        return redirect('/dashboard')

    nstudents = int(float(res[0][6]))
    session['class_id'] = res[0][0]
    args['role']=3
    session['role']=3
    # action denotes user input from the page
    if 'action' in request.args:
        if request.args['action'] == '1':  # user clicked the 'Start' button to start timer
            args['action'] = str(request.args['action'])
            args['student_id'] = session['current']
            args['class_id'] = session['class_code']
            args['role']=3
            # create entry for coding logs (NOTE: -1 log_state denotes unfinished 'Start' action
            query = 'INSERT INTO coding_logs (class_id, coder_user_id, student_id,log_state) ' \
                    'VALUES ({},{},{},-1);'.format(
                session['class_id'], session['user'], session['current'])
            du.db_query(db,query)

            # user transitions into session (countdown) state
            # render the session page and begin timer (handled in the javascript on the page)
            print("Sending user to timer from SESSION")
            print(args)
            return render_template('session.html', args=args)
        elif request.args['action'] == '2':
            #Check if this is the first user to hit sync. If so then put him in the syncing table first and the get the sync session 
            #id to populate it in the sync_session_records table after that.
            
            #Can add more where clauses. For now it is assumed that there will be only zero or one session with started_sync='no' 
            query='SELECT * from syncing1 WHERE started_sync=\'no\''
            res=du.db_query(db, query)
            if len(res) == 0:
                print("len(Res)=0")
                print("Need to start new session")
                #Checking for students if they are being repeated
                  
                query = 'INSERT INTO syncing1 (class_id, coder_user_id, student_id) VALUES ({},{},{});'.format(
                    session['class_id'],session['user'],session['current'])
                du.db_query(db, query)
                 #now use the coding_session_id    
                query = 'select coding_session_id from syncing1 where started_sync=\'no\''
                du.db_query(db, query)
                res=du.db_query(db, query)
                coding_session=res[0][0]
                print("In len=0 case")
                print(query)
                print("coding_session0",coding_session)
                role=1
                query = 'INSERT INTO sync_session_records (class_id, coder_user_id, student_id,session_id,role) VALUES ({},{},{},{},{});'.format(
                    session['class_id'],session['user'],session['current'],coding_session,role) 
                du.db_query(db, query)
                #DB operations done
                
                args['action'] = '2'  # sending to coder's ready/not ready page
                args['class_id'] = session['class_code']
                args['student_id'] = session['current']
                args['role']='1'
                args['coding_session']=coding_session
                session['coding_session']=coding_session
                session['role']=1
                args['role']=1
                print("End of the 0 case")
                return render_template('session.html', args=args)
            
            else:    
                
                
                print("Else CAse")
                #Inserting interested coders who want to sync into sync session records
                #TODO: If more than one record with started_sync='no' is returned, handle that.
                query = 'select coding_session_id from syncing1 where started_sync=\'no\''
                res=du.db_query(db, query)
                print(query)
                coding_session=res[0][0]
                print("coding_session",coding_session)
                user_id=session['user']
                
                query='SELECT * FROM sync_session_records WHERE coder_user_id={} and session_id={};'.format(user_id,coding_session)
                res=du.db_query(db, query)
                print("RES",len(res))
                
                if (len(res)==0):
                    role=2
                    query = 'INSERT INTO sync_session_records (class_id, coder_user_id, student_id,session_id,role) VALUES ({},{},{},{},{});'.format(
                            session['class_id'],session['user'],session['current'],coding_session,role) 
                
                    du.db_query(db, query)
                
                args['role']='2'
                args['action'] = '2'  # waiting
                args['class_id'] = session['class_code']
                args['student_id'] = session['current']
                args['coding_session']=coding_session
                session['coding_session']=coding_session
                session['role']=2
                args['role']=2
                return render_template('session.html', args=args)
                
        
        
        elif request.args['action'] == '3':  
            # user clicked 'Skip' button
            # transition to session landing page and go to next student
            return redirect('/session?class_code={}'.format(session['class_code']))

        elif request.args['action'] == '4':  # restart same student ('Back' button selected when waiting for coder)
            # delete the sync request that had been made
            query = 'DELETE FROM syncing WHERE class_id={} AND coder_user_id={};'.format(
                session['class_id'], session['user'])
            du.db_query(db, query)

            args['action'] = '0'  # no action
            args['class_id'] = session['class_code']
            args['student_id'] = session['current']
            args['class_id'] = session['class_code']
            # render session landing page without proceeding to the next student
            return late('session.html', args=args)
            
        elif request.args['action'] == '5': 
            query = 'SELECT * FROM syncing1 WHERE class_id={} and started_sync={};'.format(session['class_id'],'no')
            res=du.db_query(db,query)
            session['current'] = res[0][3]
            args['action'] = '5'  # syncing
            args['class_id'] = session['class_code']
            args['student_id'] = session['current']
            return render_template('session.html', args=args)
            
        else:
            # no action has been found (in session landing state)
            args['action'] = '0'  # no action

            # check to see if another coder is waiting with a sync request
            query = 'SELECT * FROM syncing WHERE class_id={} ORDER BY sync_timestamp ASC;'.format(session['class_id'])
            res = du.db_query(db, query)
            if len(res) > 0:
                # if found, automatically sync to the waiting coder
                session['current'] = res[0][3]

                if res[0][2] == session['user']:
                    # if the found entry is from the current user, delete the request
                    query = 'DELETE FROM syncing WHERE coder_user_id={};'.format(session['user'])
                    du.db_query(db, query)
                else:
                    # if found entry is from a different coder, answer the sync request
                    query = 'INSERT INTO syncing (class_id, coder_user_id, student_id) VALUES ({},{},{});'.format(
                        res[0][1], session['user'], session['current'])
                    du.db_query(db, query)

                args['action'] = '5'  # syncing
                args['class_id'] = session['class_code']
                args['student_id'] = session['current']
                query = 'INSERT INTO coding_logs (class_id, coder_user_id, student_id,log_state) ' \
                        'VALUES ({},{},{},-5);'.format(
                    session['class_id'], session['user'], session['current'])
                du.db_query(db, query)

                # render session page in 'countdown' state
                return render_template('session.html', args=args)
            else:
                # no sync requests found - proceed to render landing page
                pass
    else:
        # action does not exist in arguments - proceed with normal session landing page
        args['action'] = '0'  # no action

        # check to see if there are any sync requests
        query = 'SELECT * FROM syncing WHERE class_id={} ORDER BY sync_timestamp ASC;'.format(session['class_id'])
        res = du.db_query(db, query)
        if len(res) > 0:
            # sync request was found
            session['current'] = res[0][3]

            if res[0][2] == session['user']:
                # if the request is from the current user, delete the request (session has no action)
                query = 'DELETE FROM syncing WHERE coder_user_id={};'.format(session['user'])
                du.db_query(db, query)
            else:
                # if the request is from someone else, answer the sync request
                query = 'INSERT INTO syncing (class_id, coder_user_id, student_id) VALUES ({},{},{});'.format(
                    res[0][1], session['user'], session['current'])
                du.db_query(db, query)

            args['action'] = '5' # sync
            args['class_id'] = session['class_code']
            args['student_id'] = session['current']

            # create an empty coding log (-5 log state denotes unfinished 'Sync' action)
            query = 'INSERT INTO coding_logs (class_id, coder_user_id, student_id,log_state) ' \
                    'VALUES ({},{},{},-5);'.format(
                session['class_id'], session['user'], session['current'])
            du.db_query(db, query)

            # render the session page in the 'countdown' state
            return render_template('session.html', args=args)

    # reaching this point means there is no sync request
    # select a random student for observation
    session['current'] = str(rand.randint(1, nstudents + 1, 1)[0])
    args['class_id'] = session['class_code']
    args['student_id'] = session['current']
    print("END OF SESSION FUNCTION, RETURNING")
    print(args)
    # render session in 'landing' state
    
  
   
     ########################################################################################################
    # Querying to find the Kappa value
    #try:
        ########################################################################################################
        # Querying to find the Kappa value
    print("Calculating Kappa")
    query = 'select * from coding_logs1 where date(coding_timestamp)= date(now())  ;'
    df = pd.DataFrame(du.db_query(db, query))
    print("DF RESULT:")
    print(df)
    if (len(df.index) != 0):

        df.columns = [ 'id', 'class_id', 'coder_user_id','session_id', 'student_id', 'student_name',
                      'coding_timestamp', 'submission_timestamp', 'shows_mental_effort', 'is_on_task',
                      'affect_state',
                      'focus', 'is_writing', 'rec_aid', 'hand_raised', 'collab_peer', 'is_fidgeting',
                      'teacher_speaking']

        # session['user']
        print("STEP 1")
        num = (df['coder_user_id'].tolist())
        users = list(set(df['coder_user_id'].tolist()))
        coders_df = []
        user_df = pd.DataFrame() #NONE
        print(user_df)
        for i in users:
            if i == session['user']:
                user_df = df.loc[df['coder_user_id'] == i]
                user_df = user_df.sort_values(by=['coding_timestamp'], ascending=False)
            else:
                df1 = df.loc[df['coder_user_id'] == i]
                df1 = df1.sort_values(by=['coding_timestamp'], ascending=False)
                coders_df.append(df1)
        print("STEP 2")
        print(coders_df)
        if not user_df.empty:
            for u in coders_df:
                coder1 = user_df
                coder2 = u
                # print(users)
                # print(session['user'])
                # One hot encoding of the dataframe for each of the coders
                # coder1 = pd.get_dummies(data=coder1, columns=['affect_state', 'focus'])
                coder1_new = coder1.add_prefix('coder1_')
                # coder2 = pd.get_dummies(data=coder2, columns=['affect_state', 'focus'])
                coder2_new = coder2.add_prefix('coder2_')
                # Getting the features on which kappa has to be calculated
                coder1_features = coder1.columns
                coder1_features = coder1_features.tolist()
                coder2_features = coder2.columns
                coder2_features = coder2_features.tolist()

                coder1_features = coder1_features[8:]
                coder2_features = coder2_features[8:]

                # Finding common features and removing focus and affect state features, They will be handled seperately
                common_features = list(set(coder1_features).intersection(set(coder2_features)))
                # print(set(coder1_features))
                # affect = ["affect_state_unknown", "affect_state_bored", "affect_state_frustrated", "affect_state_concentrating",
                #           "affect_state_confused"]
                # focus = ["focus_screen", "focus_unknown", "focus_teacher", "focus_peer", "focus_work"]
                # aff = []
                # foc = []
                # for i in common_features:
                #     if i in affect:
                #         aff.append(i)
                #         common_features.remove(i)
                #     if i in focus:
                #         foc.append(i)
                #         common_features.remove(i)

                # Renaming the common columns so that we can use them in merge function
                
                coder1_new['student_id'] = coder1_new['coder1_student_id']
                del coder1_new['coder1_student_id']
                coder2_new['student_id'] = coder2_new['coder2_student_id']
                del coder2_new['coder2_student_id']
                coder1_new['session_id'] = coder1_new['coder1_session_id']
                del coder1_new['coder1_session_id']
                coder2_new['session_id'] = coder2_new['coder2_session_id']
                del coder2_new['coder2_session_id']
                print("Before merge")
                merged = coder1_new.merge(coder2_new, on=['session_id', 'student_id'], how='inner')
                print("MERGED")
                print(merged)
                print("STEP 3")
                query = 'SELECT first_name FROM user_details WHERE user_id = {};'.format(
                    list(set(coder2['coder_user_id'].tolist()))[0])
                name = np.array(du.db_query(db, query)).ravel()[0]
                # Adding kappa values to args
                for i in common_features:
                    a = "coder1_" + i
                    b = "coder2_" + i

                    # print(len(merged[a]))

                    npa = np.array(merged[a])
                    npb = np.array(merged[b])
                    try:
                        print("In try 1")
                        print(i)
                        print(merged[a])
                        print(merged[b])
                        f = np.argwhere([j != -1 and j != 'unknown' for j in npa]).ravel()
                        # print(f)
                        npa = npa[f]
                        npb = npb[f]

                        f = np.argwhere([j != -1 and j != 'unknown' for j in npb]).ravel()
                        print(f)
                        npa = npa[f]
                        npb = npb[f]
                    except ValueError:
                        print('skipped')
                        continue
                    print("NPA and NPB")
                    print(npa)

                    print(npb)
                    print('----------------')
                    try:
                        print("In try2")
                        args[i] = '{} | {}: {:<.3f}'.format(args[i], name, cohen_kappa_score(npa, npb))
                        print("i=",i,"args[i]=",args[i])
                    except KeyError:
                        args[i] = '{}: {:<.3f}'.format(name, cohen_kappa_score(npa, npb))

    #except:
    #    pass
    print(args)
    return render_template('session.html', args=args)


@app.route('/session', methods=['POST'])
def log_session():
    # TODO: (very low priority) define codings in database table and create a coding builder
    # TODO: allow for offline recording of coding logs and update when reconnected
    """
    args = dict()
    db = get_db()
    args['role']=3

    # get all the fields of the request form (observation codings)
    for i in request.form:
        args[i] = request.form[i]

    # define the string variables for easier sql generation
    str_vars = ['student_name', 'affect_state', 'focus']

    args['class_id'] = session['class_id']
    args['coder_user_id'] = session['user']
    args['role']=session['role']

	#Querying to find the Kappa value
    
    query = 'select date_trunc(\'minute\',coding_timestamp) as coding_timestamp_trunc,* from coding_logs where date(coding_timestamp)= date(now()) and log_state=5 and submission_timestamp is not null ;'
    df = pd.DataFrame(du.db_query(db,query))
    if (len(df.index)!=0):
        
        df.columns=['coding_timestamp_trunc','id','class_id','coder_user_id','student_id','student_name','coding_timestamp','submission_timestamp','shows_mental_effort','is_on_task','affect_state','focus','is_writing','rec_aid','hand_raised','collab_peer','is_fidgeting','teacher_speaking','log_state']
        
        num=(df['coder_user_id'].tolist())
        users=list(set(df['coder_user_id'].tolist()))
        coders_df=[]
        for i in users:
            df1=df.loc[df['coder_user_id']==i]
            df1=df1.sort_values(by=['coding_timestamp'],ascending=False)
            coders_df.append(df1)
        coder1=coders_df[0]
        coder2=coders_df[1]
        #One hot encoding of the dataframe for each of the coders
        coder1=pd.get_dummies(data=coder1,columns=['affect_state','focus'])
        coder1_new=coder1.add_prefix('coder1_')
        coder2=pd.get_dummies(data=coder2,columns=['affect_state','focus'])
        coder2_new=coder2.add_prefix('coder2_')
        #Getting the features on which kappa has to be calculated
        coder1_features=coder1.columns
        coder1_features=coder1_features.tolist()
        coder2_features=coder2.columns
        coder2_features=coder2_features.tolist()

        coder1_features=coder1_features[8:]
        coder2_features=coder2_features[8:]

        #Finding common features and removing focus and affect state features, They will be handled seperately
        common_features=list(set(coder1_features).intersection(set(coder2_features)))
        affect=["affect_state_unknown","affect_state_bored","affect_state_frustrated","affect_state_concentrating","affect_state_confused"]
        focus=["focus_screen","focus_unknown","focus_teacher","focus_peer","focus_work"]
        aff=[]
        foc=[]
        for i in common_features:
            if i in affect:
                aff.append(i)
                common_features.remove(i)
            if i in focus:
                foc.append(i)
                common_features.remove(i)
                    
        #Renaming the common columns so that we can use them in merge function
        coder1_new['coding_timestamp_trunc']=coder1_new['coder1_coding_timestamp_trunc']
        del coder1_new['coder1_coding_timestamp_trunc']
        coder2_new['coding_timestamp_trunc']=coder2_new['coder2_coding_timestamp_trunc']
        del coder2_new['coder2_coding_timestamp_trunc']
        coder1_new['student_id']=coder1_new['coder1_student_id']
        del coder1_new['coder1_student_id']
        coder2_new['student_id']=coder2_new['coder2_student_id']
        del coder2_new['coder2_student_id']
        merged=coder1_new.merge(coder2_new, on=['coding_timestamp_trunc','student_id'], how='inner')
        
        #Doing this in the end before returning so that args value changes just before return. Since args is being use in
        #code below for inserting values into db, we are not changing args value now.
    """
    """
        for i in common_features:
            a="coder1_"+i
            b="coder2_"+i
            if (-1 not in merged[a]) and (-1 not in merged[b]):
                args[i]=cohen_kappa_score(merged[a],merged[b])
    """
    """    
            
	
	# find most recent empty log from user (will correspond with the row generated in the previous state)
    query = 'SELECT * FROM coding_logs WHERE log_state < 0 ORDER BY coding_timestamp DESC;'
    res = du.db_query(db,query)

    if len(res) == 0:
        # if no log is found, generate the full row
        var_list = list(args.keys())[0]
        val_list = '\'{}\''.format(args[list(args.keys())[0]]) if list(args.keys())[0] in str_vars else '{}'.format(
            args[list(args.keys())[0]])

        for i in range(1, len(args.keys())):
            var_list += ',' + list(args.keys())[i]
            val_list += ',\'{}\''.format(args[list(args.keys())[i]]) if list(args.keys())[
                                                                            i] in str_vars else ',{}'.format(
                args[list(args.keys())[i]])

        query = 'INSERT INTO coding_logs (' + var_list + ') VALUES (' + val_list + ');'
        du.db_query(db,query)
    else:
        # empty corresponding log is found, fill in the missing information (and flip the sign of the log state)
        set_list = 'submission_timestamp=now(),log_state={}'.format(-1*res[0][17])

        for i in range(len(args.keys())):
            set_list += ',' + list(args.keys())[i] + '=' + \
                        ('\'{}\''.format(
                            args[list(args.keys())[i]]) if list(args.keys())[i] in str_vars else '{}'.format(
                            args[list(args.keys())[i]]))

        query = 'UPDATE coding_logs SET {} WHERE id = {};'.format(set_list, res[0][0])
        du.db_query(db,query)
    
    #Adding kappa values to args
    
    for i in common_features:
            a="coder1_"+i
            b="coder2_"+i
            if (-1 not in merged[a]) and (-1 not in merged[b]):
                args[i]=cohen_kappa_score(merged[a],merged[b])
    aff_c1=[] 
    aff_c2=[]
    #Merging all affect vectors into 1
    for i in aff:
        a="coder1_"+i
        b="coder2_"+i
        c1=merged[a]
        c2=merged[b]
        for j in c1:
            aff_c1.append(j)
        for k in c2:
            aff_c2.append(k)
        
    if (-1 not in aff_c1) and (-1 not in aff_c2):
        args['affect_State']=cohen_kappa_score(aff_c1,aff_c2)

    focus_c1=[] 
    focus_c2=[]
    #Merging all the focus vectors into 1
    for i in foc:
        a="coder1_"+i
        b="coder2_"+i
        c1=merged[a]
        c2=merged[b]
        for j in c1:
            focus_c1.append(j)
        for k in c2:
            focus_c2.append(k)
        
    if (-1 not in focus_c1) and (-1 not in focus_c2):
        args['focus']=cohen_kappa_score(focus_c1,focus_c2)
            
    # redirect to the session landing
    return render_template('session.html', args=args)
    return redirect('/session?class_code={}'.format(session['class_code']),args=args) """
    

    # TODO: (very low priority) define codings in database table and create a coding builder
    # TODO: allow for offline recording of coding logs and update when reconnected

    args = dict()
    db = get_db()

    # get all the fields of the request form (observation codings)
    for i in request.form:
        args[i] = request.form[i]

    # define the string variables for easier sql generation
    str_vars = ['student_name', 'affect_state', 'focus']

    args['class_id'] = session['class_id']
    args['coder_user_id'] = session['user']
    if ( session['role']!=3):
        args['session_id'] = session['coding_session']
    args['coding_timestamp'] = session['time']
    # find most recent empty log from user (will correspond with the row generated in the previous state)
    #query = 'SELECT * FROM coding_logs WHERE log_state < 0 ORDER BY coding_timestamp DESC;'
    #res = du.db_query(db,query)

    #if len(res) == 0:
        # if no log is found, generate the full row
    var_list = list(args.keys())[0]
    val_list = '\'{}\''.format(args[list(args.keys())[0]]) if list(args.keys())[0] in str_vars else '{}'.format(
        args[list(args.keys())[0]])
    print("Var list 1stt time:",var_list)
    for i in range(1, len(args.keys())):
        var_list += ',' + list(args.keys())[i]
        val_list += ',\'{}\''.format(args[list(args.keys())[i]]) if list(args.keys())[
                                                                        i] in str_vars else ',{}'.format(
            args[list(args.keys())[i]])
    var_list+=','+'submission_timestamp'
    val_list+=','+'timestamp with time zone \'' + str(datetime.now()) + '\''
    print("Var list 2nd time:",var_list)
    if (session['role']==3):
        query = 'INSERT INTO coding_logs (' + var_list + ') VALUES (' + val_list + ');'
        print("QUERY TO INSERT")
        print(query)
        du.db_query(db,query)
    else:
        #query='INSERT INTO store_timestamp (class_id,coder_user_id
        query = 'INSERT INTO coding_logs1 (' + var_list + ') VALUES (' + val_list + ');'
        print("QUERY TO INSERT")
        print(query)
        du.db_query(db,query)
    
    
        
    # redirect to the session landing
    #return render_template('session.html', args=args)
    return redirect('/session?class_code={}'.format(session['class_code']))
if __name__ == '__main__':
    app.run(threaded=True, debug=False, host='0.0.0.0',port=8081)
