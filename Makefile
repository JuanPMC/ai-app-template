COMPOSE_FILE := docker/docker-compose.yml
DC := docker-compose -f $(COMPOSE_FILE)

.PHONY: up down build restart logs test seed

server:
	$(DC) up -d

clean:
	$(DC) down

build:
	$(DC) build

restart: down up

logs:
	$(DC) logs -f

test:
	$(DC) run --rm app bash -c "cd /app/backend && poetry install --with test && PYTHONPATH=/app/backend poetry run pytest tests/ -v"

seed:
	$(DC) run --rm app bash -c "cd /app/backend && PYTHONPATH=/app/backend poetry run python scripts/seed_db.py $(FILE)"
