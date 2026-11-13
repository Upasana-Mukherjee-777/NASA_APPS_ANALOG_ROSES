from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings
import os

# Convert async url to sync url for synchronous utility operations
sync_db_url = settings.database_url.replace("+asyncpg", "").replace("+aiosqlite", "")

sync_engine = create_engine(sync_db_url, echo=False, poolclass=NullPool)
SyncSessionLocal = sessionmaker(sync_engine, expire_on_commit=False, class_=Session)

connect_args = {}
if "sqlite" in settings.database_url:
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args=connect_args,
    poolclass=NullPool
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def create_tables():
    Base.metadata.create_all(bind=sync_engine)
