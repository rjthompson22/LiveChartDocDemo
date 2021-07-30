package org.assistments.livechart.dao.impl.jdbc;

import java.sql.ResultSet;
import java.sql.SQLException;
import org.assistments.livechart.domain.LiveChartSeatingChart;
import org.assistments.livechart.dao.LiveChartSeatingChartDao;
import org.assistments.livechart.dao.impl.LiveChartTableType;
import org.assistments.service.dao.base.impl.JdbcHelper;
import org.assistments.service.dao.base.impl.NVPairList;
import org.assistments.service.dao.base.impl.jdbc.Jdbc;
import org.assistments.service.dao.base.impl.jdbc.JdbcBaseDao;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
@Jdbc
/*
 * Generated code: ashish 2020-08-28T13:36:46.306Z
 */
public class JdbcLiveChartSeatingChartDao extends JdbcBaseDao<LiveChartSeatingChart> implements LiveChartSeatingChartDao
{
  protected JdbcLiveChartSeatingChartDao()
  {
    super(LiveChartTableType.LIVECHART_SEATING_CHART);
  }



  @Override
  protected NVPairList getNVPairs(LiveChartSeatingChart domObj)
  {
    NVPairList params = new NVPairList();

    // Primary key not set when persisting a non-enum object
    params.addValue(LiveChartSeatingChartDao.Field.TEACHER_XREF.name, domObj.getTeacherXref());
    params.addValue(LiveChartSeatingChartDao.Field.GROUP_XREF.name, domObj.getGroupXref());
    params.addValue(LiveChartSeatingChartDao.Field.SEATING_ARRANGEMENT_JSON.name, domObj.getSeatingArrangementJson());
    params.addValue(LiveChartSeatingChartDao.Field.CREATED_AT.name, JdbcHelper.getSqlTimeStamp(domObj.getCreatedAt()));
    params.addValue(LiveChartSeatingChartDao.Field.IS_ACTIVE.name, domObj.getIsActive());


    return params;
  }

  @Override
  protected RowMapper<LiveChartSeatingChart> getRowMapper()
  {
    RowMapper<LiveChartSeatingChart> rm = new RowMapper<LiveChartSeatingChart>()
    {
      @Override
      public LiveChartSeatingChart mapRow(ResultSet rs, int rowNum) throws SQLException
      {
        LiveChartSeatingChart domObj = new LiveChartSeatingChart();
        domObj.setId(rs.getInt(LiveChartSeatingChartDao.Field.ID.name));
        domObj.setTeacherXref(rs.getString(LiveChartSeatingChartDao.Field.TEACHER_XREF.name));
        domObj.setGroupXref(rs.getString(LiveChartSeatingChartDao.Field.GROUP_XREF.name));
        domObj.setSeatingArrangementJson(rs.getString(LiveChartSeatingChartDao.Field.SEATING_ARRANGEMENT_JSON.name));
        domObj.setCreatedAt(rs.getTimestamp(LiveChartSeatingChartDao.Field.CREATED_AT.name));
        domObj.setIsActive(rs.getBoolean(LiveChartSeatingChartDao.Field.IS_ACTIVE.name));
        return domObj;
      }
    };

    return rm;
  }


}

