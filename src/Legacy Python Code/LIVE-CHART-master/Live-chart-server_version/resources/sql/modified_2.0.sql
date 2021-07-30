SELECT * FROM student_data.assignment_actions a
LEFT OUTER JOIN student_data.action_key_defn_types ad ON ad.id = a.action_defn_type_id 
LEFT OUTER JOIN student_data.problem_actions pa ON pa.id = a.action_id
LEFT OUTER JOIN student_data.action_responses ar ON (ar.id,'student_data.action_responses') = (pa.action_details_id, ad.action_details_table_name)
LEFT OUTER JOIN student_data.assignment_logs al ON al.id = a.assignment_log_id
LEFT OUTER JOIN core.external_references er ON er.id = al.user_xid
LEFT OUTER JOIN users.users u ON u.id = er.target_id
--LEFT OUTER JOIN 
WHERE a.action_defn_type_id IN (10,12,16,20)
LIMIT 100


SELECT u.id,action_details_table_name,discrete_score,assignment_log_id FROM student_data.assignment_actions a
LEFT OUTER JOIN student_data.action_key_defn_types ad ON ad.id = a.action_defn_type_id 
LEFT OUTER JOIN student_data.problem_actions pa ON pa.id = a.action_id
LEFT OUTER JOIN student_data.action_responses ar ON (ar.id,'student_data.action_responses') = (pa.action_details_id, ad.action_details_table_name)
LEFT OUTER JOIN student_data.assignment_logs al ON al.id = a.assignment_log_id
LEFT OUTER JOIN core.external_references er ON er.id = al.user_xid
LEFT OUTER JOIN users.users u ON u.id = er.target_id
--LEFT OUTER JOIN 
WHERE a.action_defn_type_id IN (10,12,16,20)
LIMIT 100


select * from users.users limit 10;









SELECT * FROM assignments LIMIT 100




--(u.id::TEXT || '_2')::character varying(255) AS user_id, a.timestamp AS action_time, ad.type AS action_type, ar.correct::INT AS correctness
SELECT * FROM student_data.action_key_defn_types

-- problem start - 10
-- problem end - 12
-- hint request - 16
-- attempt (with correctness)- 20



SELECT * FROM student_data.action_responses

SELECT * FROM student_data.action_submits