/* introduce new function to get all vacations of all users */
CREATE OR REPLACE FUNCTION ttrack_get_all_vacations ()
  RETURNS TABLE(
    day_id          INTEGER,
    day_date        DATE,
    day_target_time INTERVAL,
    usr_id          INTEGER,
    usr_firstname   TEXT,
    usr_lastname    TEXT,
    per_id          INTEGER,
    per_comment     TEXT,
    per_duration    INTERVAL
  ) LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY SELECT
                 days.day_id,
                 days.day_date,
                 days.day_target_time,
                 users.usr_id,
                 users.usr_firstname,
                 users.usr_lastname,
                 periods.per_id,
                 periods.per_comment,
                 periods.per_duration
               FROM days
                 JOIN periods on (days.day_id = periods.per_day_id)
                 JOIN users on (days.day_usr_id = users.usr_id)
               WHERE periods.per_pty_id = 'Vacation'
                     AND days.day_date <= now()
               ORDER BY days.day_date DESC, days.day_usr_id;
END
$$;
COMMENT ON FUNCTION ttrack_get_all_vacations () IS 'get vacations for all users till today';
