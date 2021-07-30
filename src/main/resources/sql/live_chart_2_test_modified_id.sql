
SELECT u.id as user_id,a.id AS ordering, pl.id AS problem_log_id, al.assignment_xid AS assignment_id, CASE WHEN pl.discrete_score IS NULL THEN 0 ELSE pl.discrete_score END AS problem_correctness, 
pl.start_time, pl.end_time, ad.type AS action, NULL AS answer_text, NULL AS work_span, extract('EPOCH' FROM (a.timestamp-pl.start_time)) AS offset_start, 
NULL AS offset_last, NULL AS offset_seconds, NULL AS milli_time, a.timestamp AS action_time, NULL AS seconds_from_midnight FROM student_data.assignment_actions a
LEFT OUTER JOIN student_data.action_key_defn_types ad ON ad.id = a.action_defn_type_id 
LEFT OUTER JOIN student_data.problem_actions pa ON pa.id = a.action_id
LEFT OUTER JOIN student_data.action_responses ar ON (ar.id,'student_data.action_responses') = (pa.action_details_id, ad.action_details_table_name)
LEFT OUTER JOIN student_data.assignment_logs al ON al.id = a.assignment_log_id
LEFT OUTER JOIN core.external_references er ON er.id = al.user_xid
LEFT OUTER JOIN users.users u ON u.id = er.target_id
LEFT OUTER JOIN student_data.problem_logs pl ON (pl.assignment_log_id, pl.problem_id) = (al.id, pa.problem_id)
--LEFT OUTER JOIN 
WHERE a.action_defn_type_id IN (10,12,16,20) and a.timestamp > '2019-01-02 16:00:00.45'
limit 10
