import os
from urllib.parse import urlparse
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if os.getenv("VERCEL"):
        raise RuntimeError("DATABASE_URL must be configured in the Vercel project environment.")
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/logpose"
# Normalizar protocolo para SQLAlchemy com o driver psycopg2 instalado
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {}
if "postgresql" in DATABASE_URL:
    connect_args = {
        "connect_timeout": 10,
        "options": "-c statement_timeout=30000"
    }
    db_host = (urlparse(DATABASE_URL).hostname or "").lower()
    if db_host.endswith(".supabase.co") or db_host.endswith(".pooler.supabase.com"):
        connect_args["sslmode"] = "require"

is_vercel_runtime = bool(os.getenv("VERCEL"))

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=1 if is_vercel_runtime else 5,
    max_overflow=0 if is_vercel_runtime else 10,
    pool_recycle=300 if is_vercel_runtime else 3600,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
