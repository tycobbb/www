include ./Makefile.base.mk

# -- cosmetics --
help-colw = 7

# -- data --
ds-src = src
ds-root = $(ds-src)/Main.ts
ds-build = build
ds-binary = $(ds-build)/www
dr-root = ./test/fixtures

# -- tools --
ts-deno = deno --unstable
ts-opts = --allow-read --allow-write --allow-run

ti-brew = brew
tb-deno = $(ts-deno)
tr-deno = $(ts-deno)

# -- init --
## [i]init dev env
init: i
.PHONY: init

i: i/pre
	$(ti-brew) bundle -v --no-upgrade
.PHONY: i

## updates deps
i/upgr:
	$(ti-brew) bundle -v
.PHONY: i/upadte

# -- i/helpers
i/pre:
ifeq ("$(shell command -v $(ti-brew))", "")
	$(info ✘ brew is not installed, please see:)
	$(info - https://brew.sh)
	$(error 1)
endif
.PHONY: i/pre

# -- build --
## [b]uild the cli
build: b
.PHONY: build

b:
	mkdir -p $(ds-build)
	$(tb-deno) compile $(ts-opts) -o $(ds-binary) $(ds-root)
.PHONY: b

## clean the build
b/clean:
	rm -rf $(ds-build)
.PHONY:

# -- run --
## [r]un the tool
run: r
.PHONY: run

r:
	$(tr-deno) run $(ts-opts) $(ds-root) $(dr-root)
.PHONY: r
