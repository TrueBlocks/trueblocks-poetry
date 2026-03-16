MSG ?= update

.PHONY: build test clean add commit push

build:
	wails build

test:
	go test ./internal/db/...
	yarn --cwd frontend test

clean:
	rm -rf build/bin

add:
	@git add -A

commit: build
	@git add -A
	@git commit -m "$(MSG)" || true

push: build
	@git add -A
	@git commit -m "$(MSG)" || true
	@git push
