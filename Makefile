.PHONY: start stop remove build restart sh logs reset pri-mig pri-gen pri-studio pri-reset seed pri-seed

start:
	docker compose up --build -d

stop:
	docker compose down

remove:
	docker compose down -v

build:
	docker compose build --no-cache

restart:
	docker compose down
	docker compose up --build -d

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