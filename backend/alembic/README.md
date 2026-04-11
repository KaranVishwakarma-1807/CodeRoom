Run migrations here when you initialize Alembic:

1. `alembic init alembic`
2. set `sqlalchemy.url` in `alembic.ini`
3. create revisions with `alembic revision --autogenerate -m "init"`
4. apply using `alembic upgrade head`
