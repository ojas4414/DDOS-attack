import psycopg2
from psycopg2 import pool as pgpool
from psycopg2.extras import RealDictCursor
import os
from contextlib import contextmanager


DB_CONFIG = {
    "host":     os.environ.get("DB_HOST", "localhost"),
    "port":     os.environ.get("DB_PORT", "5432"),
    "database": os.environ.get("DB_NAME", "sentinelapi"),
    "user":     os.environ.get("DB_USER", "sentinel"),
    "password": os.environ.get("DB_PASSWORD", "sentinel123")
}
##we dont want to hardcode the env variables due to security reaasons

# Connection pool — reused across requests instead of opening a fresh TCP +
# auth handshake on every query. ThreadedConnectionPool is the right choice
# because FastAPI runs sync endpoints in a worker threadpool.
_pool = None


def _get_pool():
    global _pool
    if _pool is None:
        _pool = pgpool.ThreadedConnectionPool(minconn=1, maxconn=10, **DB_CONFIG)
    return _pool


@contextmanager
def connection():
    pool = _get_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()##the code inside with down below runs here in try
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        pool.putconn(conn)


def init_db():
    with connection()as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ip_bans (
                id          SERIAL PRIMARY KEY,
                ip          VARCHAR(45) NOT NULL UNIQUE,
                banned_at   TIMESTAMP DEFAULT NOW(),
                reason      TEXT,
                active      BOOLEAN DEFAULT TRUE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attack_log (
                id              SERIAL PRIMARY KEY,
                detected_at     TIMESTAMP DEFAULT NOW(),
                confidence      FLOAT NOT NULL,
                rate_limit      INTEGER,
                requests_per_sec FLOAT,
                unique_ips      INTEGER,
                banned_ip_count INTEGER
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_ip_bans_ip
            ON ip_bans(ip)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_ip_bans_active
            ON ip_bans(ip, active)
        """)

def ban_ip(ip:str,reason="ml_detection"):
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO ip_bans (ip, reason, active)
            VALUES (%s, %s, TRUE)
            ON CONFLICT (ip) DO UPDATE
            SET active = TRUE, banned_at = NOW()
        """, (ip, reason))## this  if the ip already exist just reactivate teh existing ban on it no duplicates
def log_attack(confidence: float, rate_limit: int,
               requests_per_sec: float, unique_ips: int,
               banned_ip_count: int):
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO attack_log (
                confidence, rate_limit, requests_per_sec,
                unique_ips, banned_ip_count
            ) VALUES (%s, %s, %s, %s, %s)
        """, (confidence, rate_limit, requests_per_sec,
              unique_ips, banned_ip_count))


def ban_and_log(ip: str, confidence: float, rate_limit: int,
                requests_per_sec: float, unique_ips: int,
                banned_ip_count: int):
    with connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO ip_bans (ip, reason, active)
            VALUES (%s, %s, TRUE)
            ON CONFLICT (ip) DO UPDATE
            SET active = TRUE, banned_at = NOW()
        """, (ip, "ml_detection"))

        cursor.execute("""
            INSERT INTO attack_log (
                confidence, rate_limit, requests_per_sec,
                unique_ips, banned_ip_count
            ) VALUES (%s, %s, %s, %s, %s)
        """, (confidence, rate_limit, requests_per_sec,
              unique_ips, banned_ip_count))


              ## the combined func must follow aacid transaction as in acid only matters wwhen two op must succed or fail togherther not alone funcs
              ##"PostgreSQL tracks the transaction, but Python must explicitly call rollback() to cancel it.connection() guarantees that call happens automatically."
def unban_ip(ip:str):
    with connection() as conn:
        cursor=conn.cursor()
        cursor.execute("""
            UPDATE ip_bans
            SET active = FALSE
            WHERE ip = %s AND active = TRUE
        """, (ip,))
def get_active_bans() -> list:
    with connection() as conn:
        cursor=conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT ip,banned_at,reason
            FROM ip_bans
            WHERE active =TRUE
            ORDER BY banned_at DESC
        """)
        return cursor.fetchall()
         ##(ip,)  → tuple with one element
        """comma required in Python
         (ip) without comma = just parentheses
         (ip,) = actual tuple"""
        #"SQLite is single-writer. PostgreSQL handles concurrent writes from multiple threads simultaneously — essential under DDoS load.
