import Student
import datetime
print(" hii")
s1 = Student.Stud(1,'Ashvini','Varatharaj')

d=datetime.datetime.now()
s1.action_time.append(d)
s1.action_list.append('resume')

s1.getStud()
