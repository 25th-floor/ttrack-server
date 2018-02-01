include docker/mk/*.mk

# Define variables, export them and include them usage-documentation
$(eval $(call defw,NS,25thfloor))
$(eval $(call defw,REPO,ttrack-server))
$(eval $(call defw,VERSION,latest))
$(eval $(call defw,NAME,ttrack))

$(eval $(call defw,GIT_COMMIT,null))

$(eval $(call defw_h,UNAME_S,$(shell uname -s)))

ifeq (Linux,$(UNAME_S))
    $(eval $(call defw_h,AS_USER,$(shell id -u -n)))
    $(eval $(call defw_h,AS_UID,$(shell id -u)))
    $(eval $(call defw_h,AS_GID,$(shell id -g)))
endif

# Deps
running_container := $(shell docker ps -a -f "name=ttrack" --format="{{.ID}}")

# -----------------------------------------------------------------------------
# Build and ship
# -----------------------------------------------------------------------------

.PHONY: build
build:: ##@Docker Build an image
build:: buildinfo
	$(shell_env) docker \
		build \
		-t $(NS)/$(REPO):$(VERSION) \
		.

.PHONY: ship
ship:: ##@Docker Ship the image (build, ship)
ship:: ship-latest
	docker push $(NS)/$(REPO):$(VERSION)

.PHONY: ship-latest
ship-latest:: ##@Docker also ship the image with tagged version latest
	docker tag $(NS)/$(REPO):$(VERSION) $(NS)/$(REPO):latest
	docker push $(NS)/$(REPO):latest

# -----------------------------------------------------------------------------
# All things deployment - beware
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# All the convenient things for developers
# -----------------------------------------------------------------------------
ifeq (yarn,$(firstword $(MAKECMDGOALS)))
  YARN_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  $(eval $(YARN_ARGS):;@:)
endif

.PHONY: yarn
yarn:: ##@Helpers Run "yarn [<COMMAND>]" within the server container
	docker exec -ti ttrack-server yarn $(YARN_ARGS) ${OPTIONS}

.PHONY: shell
shell: ##@Helpers Get a shell within the server container
	docker exec -ti ttrack-server bash

.PHONY: postgres
postgres: ##@Helpers Get a shell within the server container
	docker exec -ti ttrack-postgres bash

.PHONY: buildinfo
buildinfo:: ##@Helpers create the buildinfo json config
	$(shell_env) echo '{"build": "$(VERSION)", "git": "$(GIT_COMMIT)"}' > ./buildinfo.json

# -----------------------------------------------------------------------------
# Local development & docker-compose
# -----------------------------------------------------------------------------
.PHONY: up
up:: ##@Compose Start the whole development stack
	$(shell_env) docker-compose \
		-f docker-compose.dev.yml \
		up \
		--build

.PHONY: start
start:: ##@Compose Start the whole development stack in detached mode
	$(shell_env) docker-compose \
		-f docker-compose.dev.yml \
		up \
		-d

.PHONY: stop
stop:: ##@Compose Start the whole development stack in detached mode
	$(shell_env) docker-compose \
		-f docker-compose.dev.yml \
		stop

.PHONY: rm
rm:: ##@Compose Clean docker-compose stack
	docker-compose \
		-f docker-compose.dev.yml \
		rm \
		--force

ifneq ($(running_container),)
	@-docker rm -f $(running_container)
endif

# -----------------------------------------------------------------------------
# Travis
# -----------------------------------------------------------------------------
.PHONY: waitforserver
waitforserver:: ##@Helpers Run "yarn [<COMMAND>]" within the server container
	docker exec -it ttrack-server wget --spider -S "http://localhost:8000/api/users/" ${OPTIONS}
