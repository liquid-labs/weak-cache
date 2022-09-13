.DELETE_ON_ERROR:
.PHONY: all build test lint lint-fix

default: build

all: build

NPM_BIN:=$(shell npm bin)
CATALYST_SCRIPTS:=$(NPM_BIN)/catalyst-scripts

WEAK_CACHE_SRC:=src
WEAK_CACHE_FILES:=$(shell find $(WEAK_CACHE_SRC) \( -name "*.js" -o -name "*.mjs" \) -not -path "*/test/*" -not -name "*.test.js")
WEAK_CACHE_TEST_SRC_FILES:=$(shell find $(WEAK_CACHE_SRC) -name "*.js" -o -name "*.mjs")
WEAK_CACHE_TEST_BUILT_FILES:=$(patsubst %.mjs, %.js, $(patsubst $(WEAK_CACHE_SRC)/%, test-staging/%, $(WEAK_CACHE_TEST_SRC_FILES)))
WEAK_CACHE_LIB:=dist/weak-cache.js

BUILD_TARGETS:=$(WEAK_CACHE_LIB)

build: $(BUILD_TARGETS)

# build rules
$(WEAK_CACHE_LIB): package.json $(WEAK_CACHE_FILES)
	JS_SRC=$(WEAK_CACHE_SRC) $(CATALYST_SCRIPTS) build

# test build and run rules
$(WEAK_CACHE_TEST_BUILT_FILES) &: $(WEAK_CACHE_TEST_SRC_FILES)
	JS_SRC=$(WEAK_CACHE_SRC) $(CATALYST_SCRIPTS) pretest

test: $(WEAK_CACHE_TEST_BUILT_FILES)
	JS_SRC=test-staging $(CATALYST_SCRIPTS) test

# lint rules
lint:
	JS_LINT_TARGET=$(WEAK_CACHE_SRC) $(CATALYST_SCRIPTS) lint

lint-fix:
	JS_LINT_TARGET=$(WEAK_CACHE_SRC) $(CATALYST_SCRIPTS) lint-fix
