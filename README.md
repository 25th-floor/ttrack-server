# TTrack Server

[![Build Status](https://travis-ci.org/25th-floor/ttrack-server.svg?branch=master)](https://travis-ci.org/25th-floor/ttrack)

A node Time Tracking application server. Needs a Postgres Database and a client.

## Working
### Makefile
Our setups always include a `Makefile` which helps with the setup. Needs Docker!

To see all possible targets just enter `make` to your cli.

Targets:
* `up`: Starts the whole development stack
* `start`: Start the stack in detached mode
* `rm`: remove the development stack

* `yarn`: to call yarn commands in the running development stack like for example `make yarn test` to run the tests.
* `shell`: get a shell within the server container
* `postgres`: get a shell within the postgres container

### Development
Just call `make up` and it will start the node server in development mode and a postgres database instance with some basic database setup.

The node server will expose port `8000` and `8001` while postgres will expose `5432` for development purposes.

### Testing

To test the server code you need a running development environment, therefor you need to call `make up` prior to the tests.

Then just calling `make yarn test` will run the tests using yarn in the server container.

### Production
TBC3

## Documentation
### API
The hapi server uses the swagger plugin to show the rest api documentation.

You can access it while the server is running using `http://localhost:8000/docs`.

### Database functions
There are several functions implemented which do much of the work.

##### Functions for administration that are not used by the code
* **create_user**(firstname text, lastname text, email text, employment_start date, target interval): create a new user and it corresponding target time
* **user_add_new_target_time**(id integer, startdate date, target interval): change target time for a user and also update days and periods.
* **user_get_periods_for_type**(id integer, start_date date, period_type character varying DEFAULT 'Vacation'::character varying): get vacations for given user starting with start_date
* **user_worktime**(id INTEGER, due_date DATE): helper function to analyze the carry calculations in the database for given user

##### Functions used by the code
* **user_calculate_carry_time**(id INTEGER, due_date DATE): calculates carry time for given user
* **user_get_day_periods**(id INTEGER, date_from TIMESTAMP, date_to TIMESTAMP): Return days between the interval for the user including the periods for that time
* **user_get_start_date**(id integer): get first date for a user relevant for ttrack
* **user_get_target_time**(id INTEGER, day_date DATE): get the calculated target time for a user on a given date.

##### Helper Functions used by other Functions
* **user_get_average_day_time**(id integer, day_date date): get the average day time of a user, does not check for workdays. (used by user_get_target_time)

## Administration

To setup the users you need to be comfortable using the psql shell and working with the database as there is no Administration Interface, everything is done using pure sql.
The `user` table is your main starting point.

### Add a User

You can use the database function `create_user` to add a user with a target time.

### Change Target Time

Users change their target time for whatever reason. TTrack is able to handle this. You can always change the target time at a specific point in time using the `user_add_new_target_time` database function.

## Contributors

Since because of security concerns we needed to purge the git commit history, here are the contributors of the project.

* Marcus Artner <ma@25th-floor.com>
* Phillip Bisson <pb@25th-floor.com>
* Andreas de Pretis <ad@25th-floor.com>
* Stefan Oestreicher <so@25th-floor.com>
* Martin Prebio <martin.prebio@gmail.com>
* Robert Prosenc <rp@25th-floor.com>
* Ali Sharif <as@25th-floor.com>
* Pierre Strohmeier <ps@25th-floor.com>
* Thomas Subera <thomas.subera@gmail.com>

## History

It all started as a fun project and never majored of it. It is strictly a tool for tracking our times with our needs. (f.e. Austrian Holidays, no Administration, ...)
