package org.assistments.livechart.dao.impl;

import org.assistments.service.dao.base.TableType;
import org.assistments.service.dao.base.impl.PersistedDataSchemaImpl;
import org.springframework.stereotype.Component;

@Component
public class LiveChartPersistableData  extends PersistedDataSchemaImpl
{
  public LiveChartPersistableData()
  {
    super(LiveChartDataSourceType.LIVECHART_SERVICE, TableType.getValues(LiveChartTableType.class));
  }
}