include docker/mk/*.mk

# Define variables, export them and include them usage-documentation
$(eval $(call defw,NS,894069252274.dkr.ecr.eu-central-1.amazonaws.com/ttrack))
$(eval $(call defw,REPO,server))
$(eval $(call defw,CI_BUILD_ID,latest))
$(eval $(call defw,VERSION,${CI_BUILD_ID}))
$(eval $(call defw,NAME,ttrack))
$(eval $(call defw,AWS_REGION,eu-central-1))

$(eval $(call defw,COMPOSE_STACK_NAME,ttrack-server))
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
	docker exec -ti $(COMPOSE_STACK_NAME) yarn $(YARN_ARGS) ${OPTIONS}

.PHONY: shell
shell: ##@Helpers Get a shell within the server container
	docker exec -ti $(COMPOSE_STACK_NAME) bash

.PHONY: postgres
postgres: ##@Helpers Get a shell within the server container
	docker exec -ti $(COMPOSE_STACK_NAME)-postgres bash

# -----------------------------------------------------------------------------
# Local development & docker-compose
# -----------------------------------------------------------------------------
.PHONY: up
up:: ##@Compose Start the whole development stack
	$(shell_env) docker-compose \
		-f docker-compose.dev.yml \
		up \
		--build

.PHONY: rm
rm:: ##@Compose Clean docker-compose stack
	docker-compose \
		-f docker-compose.dev.yml \
		rm \
		--force

ifneq ($(running_container),)
	@-docker rm -f $(running_container)
endif
