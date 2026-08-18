# top level or venv
PYTHON=python3

help:
	@echo "Housekeeping tasks for development:"
	@echo "make clean-all -- cleanup all development environments"
	@echo "make clean-backend -- cleanup after install-backend"
	@echo "make clean-deploy -- cleanup after install-deploy"
	@echo "make clean-frontend -- cleanup after install-frontend"
	@echo "make deploy -- deploy an instance (dev/staging/prod) under Dokku"
	@echo "make install-backend -- create virtual environment for Django"
	@echo "make install-deploy -- create virtual environment for deploy.py"
	@echo "make install-frontend -- install JS tools"

# note: .PHONY may be needed if files that look like the above are
# targets (or files with known extensions that could be MADE INTO them!)

################ deploy-related

DEPLOY_REQ=req-deploy.txt
DEPLOY_VENV=deploy-venv
DEPLOY_VENV_BIN=$(DEPLOY_VENV)/bin
DEPLOY_VENV_DONE=$(DEPLOY_VENV)/.done
DEPLOY_VENV_PYTHON=$(DEPLOY_VENV_BIN)/$(PYTHON)

$(DEPLOY_VENV_DONE): $(DEPLOY_REQ)
	test -d $(DEPLOY_VENV) || $(PYTHON) -mvenv $(DEPLOY_VENV)
	$(DEPLOY_VENV_PYTHON) -mpip install -r $(DEPLOY_REQ)
	touch $(DEPLOY_VENV_DONE)

install-deploy: $(DEPLOY_VENV_DONE)

deploy: $(DEPLOY_VENV_DONE)
	$(DEPLOY_VENV_BIN)/python3 dokku-scripts/deploy.py deploy

clean-deploy:
	rm -rf $(DEPLOY_VENV)

################ Django backend related

BACKEND_REQ=requirements.txt
BACKEND_VENV=venv
BACKEND_VENV_BIN=$(BACKEND_VENV)/bin
BACKEND_VENV_DONE=$(BACKEND_VENV)/.done
BACKEND_VENV_PYTHON=$(BACKEND_VENV_BIN)/$(PYTHON)

$(BACKEND_VENV_DONE): $(BACKEND_REQ)
	test -d $(BACKEND_VENV) || $(PYTHON) -mvenv $(BACKEND_VENV)
	$(BACKEND_VENV_PYTHON) -mpip install -r $(BACKEND_REQ)
	touch $(BACKEND_VENV_DONE)

install-backend: $(BACKEND_VENV_DONE)

backend: $(BACKEND_VENV_DONE)
	$(BACKEND_VENV_BIN)/python3 dokku-scripts/backend.py backend

clean-backend:
	rm -rf $(BACKEND_VENV)

################ JS frontend related

# NOT TESTED!!!
FRONTEND_REQ=package.json
# directory for _DONE, where at least SOME files as installed:
FRONTEND_DIR=node_modules
FRONTEND_DONE: $(FRONTEND_DIR)/.done

install-frontend: $(FRONTEND_DONE)

$(FRONTEND_DONE): $(FRONTEND_REQ)
	npm install
	touch $(FRONTEND_DONE)

clean-frontend:
	rm -rf $(FRONTEND_DIR)
	@exit 1

################

clean-all: clean-deploy clean-backend clean-frontend
