all: buildout

buildout:
	@buildout

dev:
	@buildout install dev

test:
	@test -f ./bin/test || make dev
	@./bin/test

clean:
	@echo "Cleaning up..."
	@echo "Removing directories and files generated by buildout..."
	@rm -vrf bin/ develop-eggs/ parts/ *.egg-info .installed.cfg
	@echo "Removing .pyc and .pyo files..."
	@find . -type f -name '*.py[co]' | grep -v '.py$$' | xargs rm -vf
	@echo "Done."
