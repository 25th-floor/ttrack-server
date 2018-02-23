/* Replace with your SQL commands */

-- change type of pty_id to allow longer varchars
ALTER TABLE period_types ALTER COLUMN pty_id TYPE varchar(15);
ALTER TABLE periods ALTER COLUMN per_pty_id TYPE varchar(15);

-- add special leave as type
INSERT INTO period_types (pty_id, pty_name, pty_config) VALUES ('SpecialLeave', 'Sonder Urlaub', '{"icon":"fa-graduation-cap", "bgcolor":"#A0D468", "color":"white", "types": {"period": false, "fullday": true, "halfday": false, "duration": false}}');

-- change icon of vacation to plane
UPDATE period_types SET pty_config = '{"icon":"fa-plane", "bgcolor":"#A0D468", "color":"white", "types": {"period": false, "fullday": true, "halfday": true}}' WHERE pty_id = 'Vacation';