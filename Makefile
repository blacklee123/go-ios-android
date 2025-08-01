
TAG?=1.0.0

tidy:
	rm -f go.sum; go mod tidy -compat=1.22

build:
	GIT_COMMIT=$$(git rev-list -1 HEAD) && CGO_ENABLED=0 go build -a -ldflags "-s -w -X github.com/blacklee123/go-ios-android/pkg/version.REVISION=$(GIT_COMMIT)" -o gia
