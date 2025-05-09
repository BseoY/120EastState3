.PHONY: test
test:
	pytest --maxfail=1 --disable-warnings -q
	npm --prefix frontend test
	npx cypress run