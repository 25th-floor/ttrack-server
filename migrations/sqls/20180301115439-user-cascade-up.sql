-- add on delete cascade for users
ALTER TABLE user_target_times DROP CONSTRAINT user_target_times_utt_usr_id_fkey;
ALTER TABLE user_target_times add constraint user_target_times_utt_usr_id_fkey FOREIGN KEY (utt_usr_id) REFERENCES users(usr_id) ON DELETE CASCADE;