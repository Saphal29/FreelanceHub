-- Fix get_user_storage_usage function to handle empty results
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS TABLE(
    total_files BIGINT,
    total_size BIGINT,
    size_by_category JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH category_stats AS (
        SELECT 
            category,
            COUNT(*) as count,
            SUM(file_size) as size
        FROM files
        WHERE uploaded_by = user_uuid 
        AND status = 'active'
        GROUP BY category
    )
    SELECT 
        COALESCE((SELECT SUM(count) FROM category_stats), 0)::BIGINT as total_files,
        COALESCE((SELECT SUM(size) FROM category_stats), 0)::BIGINT as total_size,
        COALESCE(
            (SELECT jsonb_object_agg(
                category,
                jsonb_build_object(
                    'count', count,
                    'size', size
                )
            ) FROM category_stats),
            '{}'::JSONB
        ) as size_by_category;
END;
$$ LANGUAGE plpgsql;
