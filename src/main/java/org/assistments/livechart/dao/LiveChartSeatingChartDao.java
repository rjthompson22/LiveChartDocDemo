package org.assistments.livechart.dao;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import org.assistments.livechart.domain.LiveChartSeatingChart;
import org.assistments.service.dao.base.CommonDao;
import org.assistments.service.dao.base.DaoField;
import org.assistments.service.dao.base.RelationalOpType;
import org.assistments.service.dao.base.impl.QueryTerm;
import org.assistments.service.dao.impl.DbDataType;
import org.assistments.service.dao.base.impl.NVPair;
import org.assistments.util.Pair;

/*
 * Generated code: ashish 2020-08-28T13:36:46.306Z
 */
public interface LiveChartSeatingChartDao extends CommonDao<LiveChartSeatingChart>
{
  enum Field implements DaoField
  {
    ID(DbDataType.PK,
      FieldModifier.PRIMARY_KEY, FieldModifier.REQUIRED),

    TEACHER_XREF(DbDataType.TEXT,
      FieldModifier.REQUIRED),

    GROUP_XREF(DbDataType.TEXT,
      FieldModifier.REQUIRED),

    SEATING_ARRANGEMENT_JSON(DbDataType.TEXT,
      FieldModifier.REQUIRED),

    CREATED_AT(DbDataType.TIMESTAMP,
      FieldModifier.REQUIRED),

    IS_ACTIVE(DbDataType.BOOLEAN,
      FieldModifier.REQUIRED);

    private DbDataType dataType;
    private List<Pair<FieldModifier, String>> modifierPairs;
    public String name;
    public FieldModifier[] modifiers;

    private static final List<Pair<FieldModifier, String>> noModifierPairs =
      new ArrayList<Pair<FieldModifier, String>>();

    Field(DbDataType dataType, FieldModifier... modifiers)
    {
      this.dataType = dataType;
      this.modifiers = modifiers;
      this.name = this.name().toLowerCase();
    }

    Field(DbDataType dataType, List<Pair<FieldModifier, String>> modifierPairs, FieldModifier... modifiers)
    {
      this(dataType, modifiers);
      this.modifierPairs = modifierPairs;
    }

    @Override
    public String getName()
    {
      return this.name;
    }

    @Override
    public DbDataType getDbDataType()
    {
      return this.dataType;
    }

    @Override
    public FieldModifier[] getModifiers()
    {
      return this.modifiers;
    }

    @Override
    public List<Pair<FieldModifier, String>> getFieldModifierPairs()
    {
      if (this.modifierPairs == null)
      {
        return noModifierPairs;
      }

      return this.modifierPairs;
    }

    @Override
    public QueryTerm getQueryTerm(Object value)
    {
      return new QueryTerm(this.name, value);
    }

    @Override
    public QueryTerm getQueryTerm(RelationalOpType op, Object value)
    {
      return new QueryTerm(this.name, op, value);
    }

    @Override
    public NVPair getNVPair(Object value)
    {
      return new NVPair(this.name, value);
    }
  }

  static final String TableName = "livechart_seating_chart";

  static final Set<String> MultiFieldConstraints = new HashSet<String>(Arrays.asList(

  ));

  static final Set<Pair<String, String>> TableConstraints = new HashSet<>(Arrays.asList(

  ));

  static final Set<String> AdditionalSQLs = new HashSet<String>(Arrays.asList(

  ));

  static final Set<DaoField> UserXids = new HashSet<DaoField>(Arrays.asList(

  ));



}

