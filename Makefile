.PHONY: start stop remove build restart sh logs reset pri-mig pri-gen pri-studio pri-reset seed pri-seed u d b prune test lint lint-fix test-db-setup test-int

start:
	docker compose up

stop:
	docker compose down

remove:
	docker compose down -v

build:
	docker compose up --build -d

restart:
	docker compose down
	docker compose up -d

reset:
	docker compose down -v
	docker compose up --build -d

sh:
	docker exec -it pen_ts_boilerplate_app sh

logs:
	docker compose logs -f --tail=100

pri-mig:
	docker exec -it pen_ts_boilerplate_app npx prisma migrate dev --name ${name}

pri-gen:
	docker exec -it pen_ts_boilerplate_app npx prisma generate

pri-studio:
	docker exec -it pen_ts_boilerplate_app npx prisma studio --port 5555 --browser none

pri-reset:
	docker exec -it pen_ts_boilerplate_app npx prisma migrate reset --force

seed:
	docker exec -it pen_ts_boilerplate_app npm run seed

pri-seed:
	docker exec -it pen_ts_boilerplate_app npx prisma db seed

d:
	docker compose down

u:
	docker compose up -d

b:
	docker compose up --build -d

prune:
	docker system prune -f

test:
	docker exec -it pen_ts_boilerplate_app npm run test

lint:
	docker exec -it pen_ts_boilerplate_app npm run lint

lint-fix:
	docker exec -it pen_ts_boilerplate_app npm run lint:fix

# One-time: creates the test database. Migrations run automatically via global-setup.ts.
test-db-setup:
	docker exec postgres-db psql -U postgres -c "CREATE DATABASE pen_ts_boilerplate_test;" 2>/dev/null || true

test-int:
	docker exec -it pen_ts_boilerplate_app npm run test:integration