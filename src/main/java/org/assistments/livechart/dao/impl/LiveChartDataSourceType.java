package org.assistments.livechart.dao.impl;

import org.assistments.service.dao.base.DataSourceType;

public enum LiveChartDataSourceType implements DataSourceType
{
  // If you need to access tables from the legacy db (which the SDK does not
  // support), use the same enum name as used in the SDK: LEGACY.
  // Additionally, you need to add the SdkDataSourceImpl bean to the pgService*.xml and
  // WebContent/WEB-INF/*-servlet.xml configurations.  See bean w/id = dataSourceLegacy in the SDK
  // config files.

  // LEGACY(),
  LIVECHART_SERVICE();

  LiveChartDataSourceType()
  {
    System.out.println("In LiveChartDataSourceType");
  }

  @Override
  public String getNickname()
  {
    return this.toString();
  }
}