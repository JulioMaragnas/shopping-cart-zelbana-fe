SHELL       := /bin/bash
SERVER      := jucano@192.168.1.201
REGISTRY    := 192.168.1.201:5000
APPS        := shopping-cart-zelbana-fe

REMOTE_APP  := /opt/zelbana-shopping-cart/shopping-cart-zelbana-fe
REPO        := git@github-zelbana-fe:JulioMaragnas/shopping-cart-zelbana-fe.git
BRANCH      ?= $$(shell git rev-parse --abbrev-ref HEAD)

ifneq ($(MAKECMDGOALS),git-push)
ifndef TAG
$$(error ❌ Error: Debes especificar la variable TAG obligatoriamente (ej: make deploy-test BRANCH=develop TAG=v1.0.0))
endif
endif

.PHONY: sync git-push build push deploy deploy-test check-prod-branch check-test-branch

git-push:
	@local_branch=$$(git rev-parse --abbrev-ref HEAD); \
	local_sha=$$(git rev-parse HEAD); \
	if [ "$$local_branch" = "HEAD" ]; then echo "❌ Error: Estás en detached HEAD. Cambia a una rama antes de hacer git-push."; exit 1; fi; \
	bundle_name="zelbana-fe-$$local_sha.bundle"; \
	echo "📦 Empaquetando rama '$$local_branch' ($${local_sha:0:7}) localmente..."; \
	git bundle create "/tmp/$$bundle_name" "$$local_branch"; \
	echo "🚚 Enviando paquete al Runner ($(SERVER))..."; \
	scp "/tmp/$$bundle_name" "$(SERVER):/tmp/$$bundle_name"; \
	rm -f "/tmp/$$bundle_name"; \
	echo "🔍 Sincronizando y validando rama en el Runner ($(REMOTE_APP))..."; \
	ssh $(SERVER) "cd $(REMOTE_APP) && \
		git fetch /tmp/$$bundle_name $$local_branch && \
		git checkout -B $$local_branch FETCH_HEAD && \
		git reset --hard FETCH_HEAD && \
		remote_branch=\$$(git rev-parse --abbrev-ref HEAD) && \
		remote_sha=\$$(git rev-parse HEAD) && \
		if [ \"\$$remote_branch\" != \"$$local_branch\" ] || [ \"\$$remote_sha\" != \"$$local_sha\" ]; then \
			echo \"❌ Error de validación: Servidor (\$$remote_branch @ \$$remote_sha) != Local ($$local_branch @ $$local_sha)\"; \
			rm -f /tmp/$$bundle_name; \
			exit 1; \
		fi && \
		echo \"✅ Validado: Servidor .201 en rama '\$$remote_branch' ($${local_sha:0:7}) == Mac local.\" && \
		git push origin \$$remote_branch && \
		rm -f /tmp/$$bundle_name"

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
