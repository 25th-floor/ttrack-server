.PHONY: build
build:: ##@Docker Build an image

.PHONY: ship
ship:: ##@Docker Ship the image (build, ship)

.PHONY: release
release:: ##@Docker Build and Ship
