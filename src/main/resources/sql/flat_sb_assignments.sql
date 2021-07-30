-- Get all assignment_ids corresponding with flat skill builder problem sets
SELECT id FROM class_assignments WHERE assignment_type_id = 1 AND sequence_id IN (
	-- First select all problem sets (sequences) where the first section is a mastery section
	SELECT id FROM sequences WHERE head_section_id IN (
		SELECT id FROM sections WHERE position('astery' IN type) > 0
	) AND id IN ( --also filter these to include only those sequences where every other section is a problem section by:
		SELECT ns.sequence_id FROM ( -- 1: get the total number of sections
			SELECT sequence_id, count(*) AS nsec FROM sections 
			GROUP BY sequence_id
		) AS ns
		LEFT OUTER JOIN ( -- 2: get the number of problem sections
			SELECT sequence_id, count(*) AS npr FROM sections 
			WHERE type='ProblemSection' 
			GROUP BY sequence_id 
		) AS np ON ns.sequence_id = np.sequence_id
		WHERE ns.nsec = np.npr+1 -- 3: include only those sections where the number of sections is num problems + 1
	)
)