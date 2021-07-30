import datetime
from datetime import timedelta
from time import sleep
import time


class Stud:
    def __init__(self,id, fname,lname):
        self.fname = fname
        self.lname = lname
        self.id = id
        self.action_list = []
        self.action_time= []
        self.assignment_id={}
        #self.problem_log_id=[]
        self.correctness={}
        self.timer=False;
        self.timer_time=[]
        
        
        
    def isIdle(self):
        print("IS_IDLE()")
        current_time=datetime.datetime.now()
        if(len(self.action_time)>0):
            last_action_time=self.action_time[-1]
        else:
            last_action_time=current_time
          
        
        duration=current_time-last_action_time
        duration_in_s=duration.total_seconds()
        minutes = divmod(duration_in_s, 60)[0] 
        secs=duration.seconds
        print("Current_time:",current_time)
        print("last_action:",last_action_time)
        print("Duration:",duration,type(duration))
        print("Duration2:",duration_in_s,type(duration_in_s))
        if(duration_in_s>120):
            print (self.fname ,"is IDLE , please check him out",secs)
            return True 
        else:
            print("IDLE Time difference:", minutes)
            return False
            
        
            
    def getStud(self):
        print("Student name:",self.fname)
        print("Time:",self.action_time)
        print("Action:",self.action_list)
        
    def getId(self):
        return self.id
        
    
    def check_learning(self,assign_id):
        #print("Inside Check Learning function")
        print("CHECKING LEARNING FUNCTION")
        print("ASSISTMENT IDS:",self.assignment_id)
        print("CORRECTNESS:",self.correctness)
        assign_id_probs=self.assignment_id[assign_id]
        if(len(assign_id_probs)>=3):
            results=self.correctness[assign_id]
            q3=results[-1]
            q2=results[-2]
            q1=results[-3]
            print("Results for q1,q2,q3",q1,q2,q3)
            if((q3==0) and (q2==0) and (q1==0)):
                print("Bad learning")
                self.timer=True;
                current_time=datetime.datetime.now()
                print("SETTING TIMER TRUE:",self.id)
                sleep(3)
                self.timer_timestamp=current_time;
                return 3
            elif((q1==0) and (q2==0) and (q3==1)):
                print("Good learning")
                self.timer=True;
                current_time=datetime.datetime.now()
                print("SETTING TIMER TRUE:",self.id)
                sleep(3)
                self.timer_timestamp=current_time;
                return 1
            elif((q1==1) and (q2==1) and (q3==1)):
                print("Done learning")
                self.timer=True;
                current_time=datetime.datetime.now()
                print("SETTING TIMER TRUE:",self.id)
                sleep(3)
                self.timer_timestamp=current_time;
                return 2
            else:
                print("No learning result")
                return 0
        else:
            return 0
            
    def timer_mgr(self):
        if(self.timer==True):
            
            current_time=datetime.datetime.now()
            
            
            duration=current_time-self.timer_timestamp
            duration_in_s=duration.total_seconds()
            if(duration_in_s>45):
                self.timer=False
                
                
        return self.timer
                
            
            