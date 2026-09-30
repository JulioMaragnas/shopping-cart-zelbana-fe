SHELL       := /bin/bash
SERVER      := jucano@192.168.1.201
REGISTRY    := 192.168.1.201:5000
APPS        := shopping-cart-zelbana-fe

REMOTE_APP  := /opt/zelbana-shopping-cart/shopping-cart-zelbana-fe
REPO        := git@github-zelbana-fe:JulioMaragnas/shopping-cart-zelbana-fe.git
BRANCH      ?= $$(shell git rev-parse --abbrev-ref HEAD)

ifndef TAG
$$(error ❌ Error: Debes especificar la variable TAG obligatoriamente (ej: make deploy-test BRANCH=develop TAG=v1.0.0))
endif

.PHONY: sync build push deploy deploy-test check-prod-branch check-test-branch

sync:
	@echo "══════════════════════════════════════════"
	@echo "  Branch: $(BRANCH) | Tag: $(TAG)"
	@echo "══════════════════════════════════════════"
	ssh $(SERVER) "\
		if [ ! -d $(REMOTE_APP)/.git ]; then \
			git clone $(REPO) $(REMOTE_APP); \
		fi && \
		cd $(REMOTE_APP) && \
		git fetch origin && \
		git checkout $(BRANCH) && \
		git reset --hard origin/$(BRANCH)"

build: sync
	@for app in $(APPS); do \
		echo "🔍 Verificando si el TAG $(TAG) ya existe para $$app en el registry..."; \
		ssh $(SERVER) "curl -s http://$(REGISTRY)/v2/$$app/tags/list | grep -q '\"$(TAG)\"' && echo '❌ Error: El TAG $(TAG) ya existe. Usa un tag nuevo.' && exit 1 || echo '✅ Tag validado.'" || exit 1; \
		echo "🔨 Construyendo $$app..."; \
		ssh $(SERVER) "cd $(REMOTE_APP) && \
			docker build -t $$app:$(TAG) ." || exit 1; \
	done
	@echo "🧹 Limpiando imágenes antiguas huérfanas..."
	@ssh $(SERVER) "docker image prune -f" || true

push: build
	@for app in $(APPS); do \
		echo "📤 Subiendo $$app al registry..."; \
		ssh $(SERVER) " \
			docker tag $$app:$(TAG) $(REGISTRY)/$$app:$(TAG) && \
			docker push $(REGISTRY)/$$app:$(TAG)" || exit 1; \
	done

check-prod-branch:
	@if [[ "$(BRANCH)" != release/* && "$(BRANCH)" != main ]]; then \
		echo "❌ Error: Deploy a Producción solo permitido desde ramas release/ o main"; \
		exit 1; \
	fi

deploy: check-prod-branch push
	@echo "🚀 Desplegando APPs en Producción..."
	@for app in $(APPS); do \
		ssh $(SERVER) " \
			kubectl set image deployment/zelbana-frontend zelbana-frontend=$(REGISTRY)/$$app:$(TAG) -n zelbana && \
			kubectl rollout restart deployment/zelbana-frontend -n zelbana && \
			kubectl rollout status deployment/zelbana-frontend -n zelbana --timeout=120s"; \
	done

check-test-branch:
	@if [[ "$(BRANCH)" != feature/* && "$(BRANCH)" != develop ]]; then \
		echo "❌ Error: Deploy a Test solo permitido desde ramas feature/ o develop"; \
		exit 1; \
	fi

deploy-test: check-test-branch push
	@echo "🚀 Desplegando APPs en Test..."
	@for app in $(APPS); do \
		ssh $(SERVER) " \
			KUBECONFIG=~/.kube/config-test kubectl set image deployment/zelbana-frontend zelbana-frontend=$(REGISTRY)/$$app:$(TAG) -n zelbana-test || true && \
			KUBECONFIG=~/.kube/config-test kubectl rollout restart deployment/zelbana-frontend -n zelbana-test || true && \
			KUBECONFIG=~/.kube/config-test kubectl rollout status deployment/zelbana-frontend -n zelbana-test --timeout=120s || true"; \
	done
