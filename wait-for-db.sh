#!/bin/ash
until nc db 5432; do
    echo "Waiting for PostgreSQL..."
    sleep 1
done

# После того как база стала доступна, запускаем сервер
exec "$@"