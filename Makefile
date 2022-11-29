include ./Makefile.base.mk

# -- cosmetics --
help-colw = 7

# -- data --
ds-src = ./src
ds-root = www.ts
ds-build = ./build
ds-binary = $(ds-build)/www
dr-root = ./test/fixtures

# -- tools --
ts-deno = deno --unstable
ts-opts = --allow-read --allow-write --allow-run --allow-env --allow-net

ti-brew = brew
ti-asdf = asdf
tb-deno = $(ts-deno)
tr-deno = $(ts-deno)
tt-deno = $(ts-deno)

## -- init (i) --
$(eval $(call alias, init, i/0))
$(eval $(call alias, i, i/0))

## init dev env
i/0: i/pre i/brew i/deno
.PHONY: i/0

## install initial brew deps
i/brew:
	$(ti-brew) bundle -v --no-upgrade
.PHONY: i/brew

## updates deps
i/upgr:
	$(ti-brew) bundle -v
.PHONY: i/upgr

## install deno
i/deno:
	$(ti-asdf) install
.PHONY: i/deno

# -- i/helpers
i/pre:
ifeq ("$(shell command -v $(ti-brew))", "")
	$(info ✘ brew is not installed, please see:)
	$(info - https://brew.sh)
	$(error 1)
endif
.PHONY: i/pre

## -- build (b) --
$(eval $(call alias, build, b/0))
$(eval $(call alias, b, b/0))

## build the cli
b/0:
	mkdir -p $(ds-build)
	$(tb-deno) compile $(ts-opts) -o $(ds-binary) $(ds-root)
.PHONY: b/0

## clean the build
b/clean:
	rm -rf $(ds-build)
.PHONY:

## -- run (r) --
$(eval $(call alias, run, r/0))
$(eval $(call alias, r, r/0))

## run the tool
r/0:
	$(tr-deno) run $(ts-opts) $(ds-root) $(dr-root)
.PHONY: r/0

## run the tool (server)
r/up:
	$(tr-deno) run $(ts-opts) $(ds-root) $(dr-root) --up -x 420
.PHONY: r/up

## -- test (t) --
$(eval $(call alias, test, t/0))
$(eval $(call alias, t, t/0))

## run the tests
t/0:
	$(tt-deno) test $(ts-opts)
.PHONY: t/0
