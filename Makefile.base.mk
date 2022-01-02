.DEFAULT_GOAL := help

# -- cosmetics --
rs = \033[0m
ul = \033[4;37m
bd = \033[1;37m
rd = \033[1;31m
gr = \033[0;90m
gl = \033[4;90m

# -- functions --
define alias
$(1): $(2)
.PHONY: $(1)
endef

# -- help --
help:
	@awk "$$HELP" $(MAKEFILE_LIST)
.PHONY: help

define HELP
BEGIN {
	# set props
	k_nsec = 0

	# print header
	print "$(gl)usage$(rs)"
	print "  $(bd)make <target>$(rs)\n"
	print "$(gl)targets$(rs)"
}

# match and print sections
/^## -- .* --$$/ {
	# parse name/desc
	name = $$3
	nlen = length(name)
	desc = substr($$0, 7 + nlen, length($$0) - 9 - nlen)

	# print section name
	printf "%s  $(ul)%s$(rs)%-*s$(gr) %s$(rs)\n",
		(k_nsec == 0) ? "" : "\n",
		name,
		7 - nlen,
		"",
		desc

	# incr section counter
	k_nsec++

	# consume line so next regex doesn't also match
	getline
}

# match and print targets
/^## .*$$/ {
	$$1 = ""
	desc = $$0
	getline;
	sub(/:/, "", $$1)
	name = $$1
	printf "  $(rd)%-$(help-colw)s$(gr) %s$(rs)\n", name, desc
}
endef
export HELP
