import asyncio
from logging.config import fileConfig
import sys
import os

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# 1. Agregar la raíz del proyecto al sys.path para que pueda importar "app"
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# 2. Importar el Base de SQLAlchemy y los modelos para que Alembic detecte los esquemas
from app.db.database import Base
# IMPORTANTE: Importar todos los archivos que contienen modelos
import app.models.users 
import app.models.esports 
import app.models.matches 

# 3. Importar los settings de tu app para sacar la URL de conexión
from app.core.config import settings

config = context.config

# 4. Sobrescribir la sqlalchemy.url de alembic.ini con la de nuestras variables de entorno
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 5. Pasamos el metadata de nuestra aplicación
target_metadata = Base.metadata

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
