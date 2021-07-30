package org.assistments.livechart;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.assistments.domain.core.User;
import org.assistments.domain.core.XInfo;
import org.assistments.domain.exception.NotFoundException;
import org.assistments.livechart.DataUtility.StudentReportDetail;
import org.assistments.livechart.dao.LiveChartSeatingChartDao;
import org.assistments.livechart.domain.LiveChartSeatingChart;
import org.assistments.service.dao.base.impl.QueryTerm;
import org.assistments.service.exceptions.AlreadyExistsException;
import org.assistments.service.manager.core.impl.UserManagerImpl;
import org.assistments.service.manager.lms.impl.CommonRequestAttributes;
import org.assistments.service.security.authentication.core.AuthenticationException;
import org.assistments.service.security.authentication.core.AuthenticationHolder;
import org.assistments.service.security.authorization.annotation.NeedsAuthority;
import org.assistments.service.web.ControllerHelper;
import org.assistments.service.web.ServiceType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * This is the main controller for Live-chart
 * 
 * @author ashish
 */
@Controller
public class Main
{

  @Autowired
  private DataUtility du;
  @Autowired
  LiveChartSeatingChartDao lcdao;
  @Autowired
  UserManagerImpl userMgr;

  /**
   * This is the landing page for Live-chart --> index It needs <b>TEACHER</b> authority from the ASSISTments system
   */
  @NeedsAuthority("TEACHER")
  @RequestMapping(value = "/index", method = RequestMethod.GET)
  public String login(Model model, HttpServletRequest request)
  {
    // System.out.println(AuthenticationHolder.getCurrentUser().getId());
    // System.out.println(AuthenticationHolder.getCurrentUser().getXid());
    XInfo teacherXInfo;
    User teacherInfo;
    Boolean internalErrorFlag = false;
    String groupdata = "{ \"data\": []}";
    String teacherUserName = "";

    try
    {
      teacherXInfo = AuthenticationHolder.getCurrentUser();
      groupdata = du.queryTeacherClasses(teacherXInfo);
      teacherInfo = AuthenticationHolder.getCurrentUser();
      teacherUserName = teacherInfo.getDisplayName();
      // System.out.println(teacherUserName);
    }
    catch (AuthenticationException e)
    {
      // System.out.println("Authentication error");
      // e.printStackTrace();
      String url = getRequestUrl();
      return ControllerHelper.doRedirect(ControllerHelper.buildUrl(ServiceType.LOGIN_PORTAL.getServiceUrl(),
        CommonRequestAttributes.getCommonUrlParamsAsMap(
          "TNG",
          ControllerHelper.buildUrlFromPath(request, "/index"),
          "ASSISTments")));
    }
    catch (NotFoundException e)
    {
      // e.printStackTrace();
      internalErrorFlag = true;
    }
    model.addAttribute("groupdata", groupdata);
    model.addAttribute("teacherUserName", teacherUserName);
    model.addAttribute("internalErrorFlag", internalErrorFlag);
    return "live_choose_class";
  }

  private static String getRequestUrl()
  {
    return ControllerHelper
      .getCurrentRequestUrl(((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest());
  }

  /**
   * This is the main page where the playback or live version of the class is visualized. The entire visualization needs
   * to be dynamic.
   */
  /*
   * TODO: this is setup for a single assignment for now but we will need to set it up for multiple assignments and
   * maybe multiple classes as well
   */
  @NeedsAuthority("TEACHER")
  @RequestMapping(value = "/chooseClass", method = RequestMethod.POST)
  public String chooseClass(Model model, HttpServletRequest request)
  {
    String version = request.getParameter("version");
    String xref = request.getParameter("assignmentxref");
    String assignmentName = request.getParameter("assignmentid");
    XInfo teacherXInfo;
    User teacherInfo;
    String groupdata = "{ \"data\": []}";
    String teacherUserName = "";
    Boolean internalErrorFlag = false;

    try
    {
      teacherXInfo = AuthenticationHolder.getCurrentUser();
      groupdata = du.queryTeacherClasses(teacherXInfo);
      teacherInfo = AuthenticationHolder.getCurrentUser();
      teacherUserName = teacherInfo.getDisplayName();
    }
    catch (AuthenticationException e)
    {
      // System.out.println("Authentication error");
      // e.printStackTrace();
      String url = getRequestUrl();
      return ControllerHelper.doRedirect(ControllerHelper.buildUrl(ServiceType.LOGIN_PORTAL.getServiceUrl(),
        CommonRequestAttributes.getCommonUrlParamsAsMap(
          "TNG",
          ControllerHelper.buildUrlFromPath(request, "/index"),
          "ASSISTments")));
    }
    catch (NotFoundException e)
    {
      // e.printStackTrace();
      internalErrorFlag = true;
    }


    model.addAttribute("xrefs", "\"" + xref + "\"");
    model.addAttribute("assignmentName", assignmentName);
    model.addAttribute("groupdata", groupdata);
    model.addAttribute("teacherUserName", teacherUserName);
    model.addAttribute("playbackFlag", version.equals("playback"));
    model.addAttribute("internalErrorFlag", internalErrorFlag);
    return "seating_chart_with_names";
  }

  @NeedsAuthority("TEACHER")
  @RequestMapping(value = "/signout", method = RequestMethod.GET)
  public String signout(Model model, HttpServletRequest request)
  {
    // Sign off the User
    AuthenticationHolder.signUserOff();

    // Clear session
    request.getSession().invalidate();
    return ControllerHelper.doRedirect(ControllerHelper.buildUrlFromPath(request, "/index"));
  }

  /*
   * The first two methods serve .jsp pages and the rest of the methods are going to behave as API that returns data as
   * per the requirement
   */
  @NeedsAuthority("TEACHER")
  @RequestMapping(value = "/getStudentReportDetail", method = RequestMethod.POST)
  @ResponseBody
  public List<StudentReportDetail> giveAction(@RequestBody String xref)
  {
    List<StudentReportDetail> jsonadata = null;
    // System.out.println("Getting new students");
    try
    {
      // System.out.println(xref);
      jsonadata = du.getRecentActionofAllUsers2(xref);
    }
    catch (Exception e)
    {
      // e.printStackTrace();
      return null;
    }
    return jsonadata;
  }

  @SuppressWarnings("unchecked")
  @NeedsAuthority("TEACHER")
  @RequestMapping(value = "/saveSeatingChart", method = RequestMethod.POST)
  @ResponseBody
  public boolean saveSeatingChart(@RequestBody String jsonString)
  {
    ObjectMapper mapper = new ObjectMapper();
    LiveChartSeatingChart lc = new LiveChartSeatingChart();
    JsonNode json = null;

    try
    {
      json = mapper.readTree(jsonString);

      lc.setTeacherXref(AuthenticationHolder.getCurrentUser().getXref());
      lc.setGroupXref(json.get("groupXRef").asText());
      lc.setSeatingArrangementJson(json.get("seatingArrangement").asText());
    }
    catch (IOException e1)
    {
      // e1.printStackTrace();
    }

    if (json != null)
    {
      try
      {
        lcdao.persist(lc);
      }
      catch (AlreadyExistsException e)
      {
        // e.printStackTrace();
        return false;
      }
    }


    /*
     * int dbid = lcdao.findId(lc); lcdao.deleteById(dbid);
     */

    return true;
  }

  @NeedsAuthority("TEACHER")
  @RequestMapping(value = "/deleteSeatingChart", method = RequestMethod.POST)
  @ResponseBody
  public boolean deleteSeatingChart(@RequestBody String jsonString)
  {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode json = null;
    // System.out.println("In deleteSeatingChart");

    try
    {
      // System.out.println(jsonString);
      json = mapper.readTree(jsonString);
      // System.out.println("json object received");
    }
    catch (IOException e2)
    {
      // e2.printStackTrace();
    }

    try
    {
      int id = json.get("dbID").asInt();
      lcdao.deleteById(id);
    }
    catch (NotFoundException e)
    {
      // System.out.println("Something went terribly, terribly wrong.");
      return false;
    }

    // System.out.println("Got a request to delete a seating chart, request succeeded");
    return true;
  }

  @NeedsAuthority("TEACHER")
  @RequestMapping(value = "/getSeatingChart", method = RequestMethod.POST)
  @ResponseBody
  public List<String> getSeatingChart(@RequestBody String groupXRef)
  {
    String teacherXRef = AuthenticationHolder.getCurrentUser().getXref();

    List<QueryTerm> qt = new ArrayList<QueryTerm>();
    qt.add(new QueryTerm("teacher_xref", teacherXRef));
    qt.add(new QueryTerm("group_xref", groupXRef));

    List<String> chart = new ArrayList<String>();
    try
    {
      List<LiveChartSeatingChart> chartResults = new ArrayList<LiveChartSeatingChart>();
      chartResults = lcdao.findAllObjects(qt);
      for (LiveChartSeatingChart chartResult : chartResults)
      {
        String str = chartResult.getSeatingArrangementJson();
        String newstr = "{\"dbID\":" + chartResult.getDbid() + "," + str.substring(1);
        // System.out.println(newstr);
        chart.add(newstr);
      }
    }
    catch (NotFoundException e)
    {
      // e.printStackTrace();
      chart.add("NOT_FOUND_EXCEPTION");
    }
    return chart;
  }
}
