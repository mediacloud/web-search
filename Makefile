# top level or venv
PYTHON=python3

help:
	@echo "Utilities for managing development:"
	@echo "make deploy -- deploy an instance (dev/staging/prod)"
	@echo "make install-deploy -- create virtual environment for deploy.py"
	@echo "make install-backend -- create virtual environment for Django"
	@echo "make install-frontend -- install JS tools"
	@echo "make clean-deploy -- cleanup after install-deploy"
	@echo "make clean-backend -- cleanup after install-backend"
	@echo "make clean-all -- cleanup all development environments"

# note: .PHONY may be needed if files that look like the above
# targets (or files that could be MADE INTO them!)

################ deploy-related

DEPLOY_VENV=deploy-venv
DEPLOY_VENV_BIN=$(DEPLOY_VENV)/bin
DEPLOY_VENV_DONE=$(DEPLOY_VENV)/.done
DEPLOY_VENV_PYTHON=$(DEPLOY_VENV_BIN)/$(PYTHON)

$(DEPLOY_VENV_DONE): req-deploy.txt
	test -d $(DEPLOY_VENV) || $(PYTHON) -mvenv $(DEPLOY_VENV)
	$(DEPLOY_VENV_PYTHON) -mpip install -r req-deploy.txt
	touch $(DEPLOY_VENV_DONE)

install-deploy: $(DEPLOY_VENV_DONE)

deploy: $(DEPLOY_VENV_DONE)
	$(DEPLOY_VENV_BIN)/python3 dokku-scripts/deploy.py deploy

clean-deploy:
	rm -rf $(DEPLOY_VENV)

################ Django backend related

BACKEND_VENV=venv
BACKEND_VENV_BIN=$(BACKEND_VENV)/bin
BACKEND_VENV_DONE=$(BACKEND_VENV)/.done
BACKEND_VENV_PYTHON=$(BACKEND_VENV_BIN)/$(PYTHON)

$(BACKEND_VENV_DONE): requirements.txt
	test -d $(BACKEND_VENV) || $(PYTHON) -mvenv $(BACKEND_VENV)
	$(BACKEND_VENV_PYTHON) -mpip install -r requirements.txt
	touch $(BACKEND_VENV_DONE)

install-backend: $(BACKEND_VENV_DONE)

backend: $(BACKEND_VENV_DONE)
	$(BACKEND_VENV_BIN)/python3 dokku-scripts/backend.py backend

clean-backend:
	rm -rf $(BACKEND_VENV)

################ JS frontend related

# NOT TESTED
install-frontend:
	npm install

clean-frontend:
	@echo "not yet implemented"
	@exit 1

################

clean-all: clean-deploy clean-backend clean-frontend
