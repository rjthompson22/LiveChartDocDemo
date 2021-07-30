package org.assistments.livechart.dao.impl;

import org.assistments.livechart.dao.LiveChartSeatingChartDao;
import org.assistments.service.dao.base.PersistedDataList;
import org.assistments.service.dao.base.TableType;
import org.assistments.service.dao.base.impl.TableTypeImpl;

public class LiveChartTableType implements PersistedDataList
{
  // Solely to show how to configure your db with schemas other than the default "public"
  // Here we have a single schema defined. Of course you would likely have more than one
  // (otherwise, why not use the single default "public"?).
  //
  // public enum PgSchemaType implements SchemaType
  // {
  // GREETING_DATA;
  //
  // @Override
  // public String getName()
  // {
  // return this.name().toLowerCase();
  // }
  // }
  //
  // public static TableType GREETINGS = new TableTypeImpl(PgSchemaType.GREETING_DATA, TableReplicationType.NONE,
  // GreetingDao.class);
  // public static TableType GREETING_USAGES = new TableTypeImpl(PgSchemaType.GREETING_DATA, TableReplicationType.NONE,
  // GreetingUsageDao.class);

  // By default, in this format of declaring the TableType, each table is in the default "public" schema
  // w/out any table replication expected in the future.
  public static TableType LIVECHART_SEATING_CHART = new TableTypeImpl(LiveChartSeatingChartDao.class);
}
