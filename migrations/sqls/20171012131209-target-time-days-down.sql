-- remove new field
ALTER TABLE user_target_times DROP COLUMN utt_target_time_days;

-- revert function user_get_average_day_time
CREATE OR REPLACE FUNCTION user_get_average_day_time (id INTEGER, day_date DATE) RETURNS INTERVAL
LANGUAGE plpgsql
AS $$
DECLARE
  target        INTERVAL;
BEGIN

  SELECT utt_target_time/5
  INTO   target
  FROM   user_target_times
  WHERE  utt_usr_id = id
         AND    COALESCE(TSRANGE(utt_start, utt_end, '[)') @> day_date::TIMESTAMP, TRUE);


  RETURN COALESCE(target, '00:00:00'::INTERVAL);
END
$$;


-- revert function user_get_target_time
CREATE OR REPLACE FUNCTION user_get_target_time (id INTEGER, day_date DATE) RETURNS interval
LANGUAGE plpgsql
AS $$
DECLARE
  target        INTERVAL;
  start_date    DATE;
BEGIN

  -- done explicitly to check if user exists, otherwise function doesn't get called due to the optimizer
  SELECT user_get_start_date(id)
  INTO   STRICT start_date;


  SELECT CASE
         WHEN day_date >= start_date  AND EXTRACT(ISODOW FROM day_date) < 6
           THEN user_get_average_day_time(id, day_date)
         ELSE '00:00:00'::INTERVAL
         END
  INTO   target;

  RETURN target;
END
$$;

-- revert function to get start date for user since it's used multiple times
CREATE OR REPLACE FUNCTION user_add_new_target_time (id INTEGER, startdate DATE, target INTERVAL) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  old_target  INTERVAL;
BEGIN
  BEGIN
    -- get old target time
    SELECT utt_target_time
    INTO STRICT old_target
    FROM user_target_times
    WHERE utt_usr_id = id
          AND utt_end = 'infinity'
          AND TSRANGE(utt_start, utt_end, '[)') @> startdate::TIMESTAMP;

    -- first end the active one
    UPDATE user_target_times
    SET utt_end = startdate
    WHERE utt_usr_id = id
          AND utt_end = 'infinity'
          AND TSRANGE(utt_start, utt_end, '[)') @> startdate::TIMESTAMP;

    -- now create a new one
    INSERT INTO user_target_times VALUES (id, startdate, 'infinity', target);

    -- update days
    -- update full days
    UPDATE days SET day_target_time = target/5 WHERE day_usr_id = id AND day_date >= startdate AND day_target_time = old_target/5;
    -- update half days
    UPDATE days SET day_target_time = target/10 WHERE day_usr_id = id AND day_date >= startdate AND day_target_time = old_target/10;

    -- update periods?
    -- update full periods
    UPDATE periods SET per_duration = target/5
    FROM days
    WHERE day_id = per_day_id
          AND day_usr_id = id
          AND day_date >= startdate
          AND per_pty_id IN ('Vacation', 'Sick', 'Nursing', 'Holiday')
          AND per_duration = old_target/5;

    -- update half day periods
    UPDATE periods SET per_duration = target/10
    FROM days
    WHERE day_id = per_day_id
          AND day_usr_id = id
          AND day_date >= startdate
          AND per_pty_id IN ('Vacation', 'Sick', 'Nursing', 'Holiday')
          AND per_duration = old_target/10;

    EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE EXCEPTION 'user % not found', id;
  END;
END
$$;

-- revert create_user
CREATE OR REPLACE FUNCTION create_user (firstname TEXT, lastname TEXT, email TEXT, employment_start DATE, target INTERVAL)
  RETURNS SETOF users
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY WITH inserted_user AS (
    INSERT INTO users (usr_firstname, usr_lastname, usr_email, usr_employment_start)
    VALUES (firstname, lastname, email, employment_start)
    RETURNING *), inserted_target_time AS(
    INSERT INTO user_target_times
      SELECT usr_id, employment_start, 'infinity', target
      FROM inserted_user
    RETURNING *)
  SELECT * FROM inserted_user;
END
$$;
