package org.assistments.livechart;

import java.util.ArrayList;
import java.util.List;
import org.assistments.domain.core.Assignment;
import org.assistments.domain.core.ExternalReferenceType;
import org.assistments.domain.core.User;
import org.assistments.domain.core.XInfo;
import org.assistments.domain.exception.NotFoundException;
import org.assistments.domain.groups.GroupType;
import org.assistments.domain.groups.principals.PrincipalsGroup;
import org.assistments.domain.report.Report;
import org.assistments.domain.report.UserReport;
import org.assistments.service.dao.impl.IsActiveFilterType;
import org.assistments.service.manager.core.AssignmentManager;
import org.assistments.service.manager.groups.principals.IPrincipalsGroupManager;
import org.assistments.service.manager.report.ReportManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DataUtility
{

  @Autowired
  private IPrincipalsGroupManager principalGroupManager;
  @Autowired
  private AssignmentManager assignmentManager;
  @Autowired
  private ReportManager repManager;

  /**
   * This method queries the database and returns a String: group of classes that have been assigned by the particular
   * Teacher.
   * 
   * @param <b>teacherXInfo</b> the XInfo of the teacher
   * @return list of group of classes assigned by the teacher
   */
  public String queryTeacherClasses(XInfo teacherXInfo) throws NotFoundException
  {
    List<PrincipalsGroup> groups = principalGroupManager.getAllGroupsOwnedByUser(teacherXInfo,
      GroupType.PRINCIPALS);
    List<GroupAssignmentDetail> groupAssignmentDetails = new ArrayList<DataUtility.GroupAssignmentDetail>();
    for (PrincipalsGroup group : groups)
    {
      try
      {
        List<Assignment> assignments = assignmentManager.findAssignmentsToGroup(group.getXinfo(),
          IsActiveFilterType.ENABLED);
        // List<Assignment> assignments = assignmentManager.findAssignmentsToGroup(group.getXinfo());
        groupAssignmentDetails.add(new GroupAssignmentDetail(group, assignments));
      }
      catch (Exception e)
      {
        // e.printStackTrace();
      }
    }

    return parseObjToJson(groupAssignmentDetails);
  }

  private class GroupAssignmentDetail
  {
    @SuppressWarnings("unused")
    private PrincipalsGroup group;
    @SuppressWarnings("unused")
    private List<Assignment> assignments;

    public GroupAssignmentDetail(PrincipalsGroup group, List<Assignment> assignments)
    {
      this.group = group;
      this.assignments = assignments;
    }

    @SuppressWarnings("unused")
    public PrincipalsGroup getGroup()
    {
      return group;
    }

    @SuppressWarnings("unused")
    public void setGroup(PrincipalsGroup group)
    {
      this.group = group;
    }

    @SuppressWarnings("unused")
    public List<Assignment> getAssignments()
    {
      return assignments;
    }

    @SuppressWarnings("unused")
    public void setAssignments(List<Assignment> assignments)
    {
      this.assignments = assignments;
    }
  }

  public String queryAssignmentsInGrp(String xref)
  {
    XInfo groupXInfo = ExternalReferenceType.PRINCIPAL_GROUP.getXInfo(xref);
    List<Assignment> assignments = null;
    try
    {
      assignments = assignmentManager.findAssignmentsToGroup(groupXInfo);
    }
    catch (NotFoundException e)
    {
      // e.printStackTrace();
    }
    catch (Exception e)
    {
      // e.printStackTrace();
    }
    return parseObjToJson(assignments);
  }

  public List<StudentReportDetail> getRecentActionofAllUsers2(String assignmentXRef)
  {
    List<StudentReportDetail> detailedReport = new ArrayList<DataUtility.StudentReportDetail>();
    try
    {

      List<CustomUserInfo> customUsers = new ArrayList<DataUtility.CustomUserInfo>();

      XInfo assignmentXInfo = ExternalReferenceType.ASSIGNMENT.getXInfo(assignmentXRef);
      Report report = repManager.getReport(assignmentXInfo);

      List<User> reportUsers = report.getUsers();
      for (User user : reportUsers)
      {
        CustomUserInfo customUser = new CustomUserInfo(user.getUsername(), user.getFirstName(),
          user.getLastName(), user.getXref());
        customUsers.add(customUser);
      }

      List<?> problems = report.getProblemEntries();
      List<UserReport> userReport = report.getUserReports();

      StudentReportDetail studentReportDetail = new StudentReportDetail(customUsers, problems, userReport);
      detailedReport.add(studentReportDetail);

    }
    catch (IllegalStateException e)
    {
      // e.printStackTrace();
    }
    catch (NotFoundException e)
    {
      // e.printStackTrace();
    }
    return detailedReport;
  }

  private String parseObjToJson(List<?> objedct)
  {
    ObjectMapper objMapper = new ObjectMapper();
    String jsonData = "{\"data\": []}";
    try
    {
      jsonData = objMapper.writeValueAsString(objedct);
    }
    catch (JsonProcessingException e)
    {
      // e.printStackTrace();
      return "{\"data\": []}";
    }
    // System.out.println(jsonData.length());
    return "{\"data\":" + jsonData + "}";
  }

  public class StudentReportDetail
  {
    private List<CustomUserInfo> users;
    private List<?> problems;
    private List<UserReport> userReport;

    public StudentReportDetail(List<CustomUserInfo> users, List<?> problems, List<UserReport> userReport)
    {
      this.users = users;
      this.problems = problems;
      this.userReport = userReport;
    }

    public List<CustomUserInfo> getUsers()
    {
      return users;
    }

    public List<?> getProblems()
    {
      return problems;
    }

    public List<UserReport> getUserReport()
    {
      return userReport;
    }

    public void setUsers(List<CustomUserInfo> users)
    {
      this.users = users;
    }

    public void setProblems(List<?> problems)
    {
      this.problems = problems;
    }

    public void setUserReport(List<UserReport> userReport)
    {
      this.userReport = userReport;
    }
  }

  private class CustomUserInfo
  {
    private String username;
    private String firstname;
    private String lastname;
    private String userXref;

    public CustomUserInfo(String username, String firstname, String lastname, String userXref)
    {
      this.username = username;
      this.firstname = firstname;
      this.lastname = lastname;
      this.userXref = userXref;

    }

    public void setUsername(String username)
    {
      this.username = username;
    }

    public void setFirstname(String firstname)
    {
      this.firstname = firstname;
    }

    public void setLastname(String lastname)
    {
      this.lastname = lastname;
    }

    public void setUserXref(String userXref)
    {
      this.userXref = userXref;
    }

    public String getUsername()
    {
      return username;
    }

    public String getFirstname()
    {
      return firstname;
    }

    public String getLastname()
    {
      return lastname;
    }

    public String getUserXref()
    {
      return userXref;
    }
  }
}
