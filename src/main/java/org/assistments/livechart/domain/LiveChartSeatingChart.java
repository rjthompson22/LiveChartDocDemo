package org.assistments.livechart.domain;

import java.time.Instant;
import java.sql.Timestamp;
import org.assistments.util.ToStringHelper;
import org.assistments.util.Util;
import org.assistments.domain.DbObjectImpl;

/*
 * Generated code: ashish 2020-08-28T13:36:46.323Z
 */
public class LiveChartSeatingChart extends DbObjectImpl
{
  private String teacherXref;
  private String groupXref;
  private String seatingArrangementJson;
  private Instant createdAt;
  private boolean isActive;

  public LiveChartSeatingChart()
  {
    this.createdAt = Instant.now();
    this.isActive = true;
  }

  public void setTeacherXref(String teacherXref)
  {
    this.teacherXref = teacherXref;
  }

  public String getTeacherXref()
  {
    return this.teacherXref;
  }

  public void setGroupXref(String groupXref)
  {
    this.groupXref = groupXref;
  }

  public String getGroupXref()
  {
    return this.groupXref;
  }

  public void setSeatingArrangementJson(String seatingArrangementJson)
  {
    this.seatingArrangementJson = seatingArrangementJson;
  }

  public String getSeatingArrangementJson()
  {
    return this.seatingArrangementJson;
  }

  public void setCreatedAt(Instant createdAt)
  {
    this.createdAt = createdAt;
  }

  public void setCreatedAt(Timestamp createdAt)
  {
    if (createdAt != null)
    {
      this.createdAt = createdAt.toInstant();
    }
  }

  public Instant getCreatedAt()
  {
    return this.createdAt;
  }

  public void setIsActive(boolean isActive)
  {
    this.isActive = isActive;
  }

  public boolean getIsActive()
  {
    return this.isActive;
  }

  @Override
  public String toString()
  {
    StringBuilder sb = new StringBuilder(LiveChartSeatingChart.class.getSimpleName())
      .append(":").append(Util.NL)
      .append(ToStringHelper.variableToString("id", super.getId(), true))
      .append(ToStringHelper.variableToString("teacherXref", teacherXref, true))
      .append(ToStringHelper.variableToString("groupXref", groupXref, true))
      .append(ToStringHelper.variableToString("seatingArrangementJson", seatingArrangementJson, true))
      .append(ToStringHelper.variableToString("createdAt", createdAt, true))
      .append(ToStringHelper.variableToString("isActive", isActive, true));
    return sb.toString();
  }
}

