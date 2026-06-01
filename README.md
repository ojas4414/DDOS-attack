# 🛡️ SentinelAPI — Real-Time DDoS Detection & Mitigation Gateway

<div align="center">

![SentinelAPI Banner](https://img.shields.io/badge/SENTINEL-API-6366f1?style=for-the-badge&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776ab?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-CNN-ee4c2c?style=for-the-badge&logo=pytorch&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=for-the-badge&logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)

**A full-stack intrusion detection system that classifies API traffic in real time using a 1D-CNN, bans attacking IPs in PostgreSQL, and streams live threat intelligence to a cinematic security operations dashboard.**

</div>

---

## 🎥 Dashboard Preview

> Login page · Live traffic chart · Real-time ban table · Attack alert overlay

```
┌─────────────────────────────────────────────────────────────┐
│  🛡 SENTINEL  THREAT INTELLIGENCE PLATFORM    ● SECURE LINK │
├──────────┬──────────┬───────────────┬────────────────────────┤
│ REQ/SEC  │  BANS    │ THREAT LEVEL  │  MODEL STATUS          │
│  342.1   │   12     │   CRITICAL    │    READY               │
│  req/s   │ blocked  │               │  CNN · 1D · SEQ:10     │
├──────────┴──────────┴───────────────┴────────────────────────┤
│  LIVE TRAFFIC — REQ/SEC                      LAST 10 MIN     │
│                                     ██                       │
│              ▄▄▄▄                  ████                      │
│  ▂▃▄▅▄▃▂▂▃▄▅████▇▆▅▄▃▂▂▃▄▅▆▇███████████                    │
├──────────────────────────┬──────────────────────────────────┤
│  BLOCKED ADDRESSES       │  IP             BANNED    REASON  │
│  12 ACTIVE               │  192.168.1.23   2m ago    ml_det  │
│                          │  192.168.1.10   2m ago    ml_det  │
└──────────────────────────┴──────────────────────────────────┘
```

---

## ⚙️ Architecture

```
                          ┌─────────────────────────────────┐
  INTERNET  ─────────────▶│   C++ Packet Interceptor        │
                          │   • Thread pool (8 workers)     │
                          │   • Trie-based IP lookup O(4)   │
                          │   • Condition-variable queue    │
                          └──────────────┬──────────────────┘
                                         │
                          ┌──────────────▼──────────────────┐
                          │   Feature Extractor (Python)    │
                          │   • Sliding window (10s)        │
                          │   • Heap top-K IPs  O(N log K)  │
                          │   • Shannon entropy (endpoints) │
                          │   • req/s, unique IPs, payload  │
                          └──────────────┬──────────────────┘
                                         │  feature vector [6]
                          ┌──────────────▼──────────────────┐
                          │   1D-CNN ML Engine (PyTorch)    │
                          │   • Sequence length: 10 windows │
                          │   • Conv1d → ReLU → AvgPool     │
                          │   • Outputs: normal / attack    │
                          │   • Confidence threshold: 0.85  │
                          └──────────────┬──────────────────┘
                                         │  {label, confidence}
                          ┌──────────────▼──────────────────┐
                          │   Decision Engine               │
                          │   • DP rate-limit threshold     │
                          │   • Ban IPs with count > 500    │
                          │   • Factory pattern detectors   │
                          └──────┬───────────────┬──────────┘
                                 │               │
               ┌─────────────────▼──┐   ┌───────▼─────────────┐
               │  PostgreSQL         │   │  WebSocket Broadcast │
               │  • ip_bans table    │   │  • JWT-authenticated │
               │  • attack_log table │   │  • Per-conn queue    │
               │  • ACID atomicity   │   │  • 10s cadence       │
               └─────────────────────┘   └───────┬─────────────┘
                                                  │
                          ┌───────────────────────▼──────────┐
                          │   React Dashboard (SPA)          │
                          │   • Live traffic chart (SVG)     │
                          │   • Ban table + unban flow       │
                          │   • Attack alert overlay         │
                          │   • JWT in memory (not storage)  │
                          └──────────────────────────────────┘
```

---

## 🧠 CS Concepts Implemented

| 🔖 Concept | 📁 Location | 💡 Purpose |
|:---:|:---:|:---:|
| **Trie** | `cpp/trie.hpp` | O(4) IP prefix matching for instant block/allow |
| **Thread Pool + Mutex** | `cpp/interceptor.cpp` | Concurrent request handling with condition variable |
| **Min-Heap** | `backend/feature_extractor.py` | Top-K attacking IPs in O(N log K) |
| **Sliding Window** | `backend/feature_extractor.py` | Rolling 10-second traffic window |
| **1D-CNN** | `backend/ml_engine.py` | Traffic sequence classification |
| **Shannon Entropy** | `backend/feature_extractor.py` | Endpoint distribution uniformity metric |
| **Connection Pool** | `backend/database.py` | Reuse DB connections under load (ThreadedConnectionPool) |
| **ACID Transactions** | `backend/database.py` | Atomic ban + audit log (rollback on failure) |
| **Token Bucket** | `backend/auth.py` | Per-IP login rate limiting |
| **JWT Auth** | `backend/auth.py` | Stateless session tokens, WS-gated |
| **Observer / Queue** | `backend/main.py` | Per-connection asyncio.Queue for safe WS broadcast |
| **Factory Pattern** | `backend/decision_engine.py` | Pluggable attack detector registry |
| **Asyncio Tasks** | `backend/main.py` | Concurrent detection loop + simulator |

---

## 🗂️ Project Structure

```
SentinelAPI/
│
├── 🐳 docker-compose.yml          # Postgres + API, one command to run
├── 🐳 Dockerfile                  # Python 3.11-slim, torch CPU build
├── 📋 requirements.txt            # FastAPI, psycopg2, PyJWT, numpy
│
├── 🖥️  backend/
│   ├── main.py                    # FastAPI app, WebSocket, detection loop
│   ├── feature_extractor.py       # Sliding window, heap top-K, entropy
│   ├── ml_engine.py               # 1D-CNN definition, train(), predict()
│   ├── decision_engine.py         # Rate-limit DP, Factory detectors
│   ├── database.py                # Connection pool, ACID ban + log
│   ├── auth.py                    # JWT creation/verification, token bucket
│   ├── simulator.py               # Traffic simulator (normal + attack phases)
│   └── shared.py                  # Singleton feat_extractor shared module
│
├── 🎨 security/                   # Primary dashboard UI (served at /)
│   ├── index.html                 # React CDN + Babel, loads all JSX
│   ├── app.jsx                    # Root: login, WS, polling, state
│   ├── login.jsx                  # POST /auth/login, JWT in memory
│   ├── navbar.jsx                 # Live clock, connection status
│   ├── statcards.jsx              # 4 animated stat cards
│   ├── chart.jsx                  # Custom SVG area chart, hover tooltip
│   ├── bantable.jsx               # Ban rows, copy IP, two-step unban
│   ├── alert.jsx                  # Attack overlay, countdown bar
│   ├── background.jsx             # 33-particle field, nebula blobs, scanlines
│   ├── icons.jsx                  # Stroke SVG icons + useCountUp hook
│   ├── styles.css                 # Layout, glass cards, animations
│   └── components.css             # Component-level styles
│
├── ⚡ cpp/
│   ├── trie.hpp                   # IPv4 trie, insert/search/remove
│   └── interceptor.cpp            # TCP server, thread pool, mutex
│
└── 🧪 tests/
    ├── test_feature.py            # Feature extractor unit tests
    ├── test_decision.py           # Decision engine + Factory tests
    └── test_trie.py               # C++ trie (integration note)
```

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running

### One command
```bash
git clone https://github.com/ojas4414/DDOS-attack.git
cd DDOS-attack
docker compose up --build
```

Open **http://localhost:8000** and log in:

```
Username:  admin
Password:  sentinel123
```

> 💡 The **traffic simulator** starts automatically on boot — the chart fills with live data immediately. The ML model detects attack phases (~100s after startup) and begins banning IPs.

### Subsequent runs (no code changes)
```bash
docker compose up
```

### Stop everything
```bash
docker compose down
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|:---:|:---:|:---:|:---|
| `POST` | `/auth/login` | ❌ | Returns `{ access_token }` JWT |
| `GET` | `/bans` | ✅ JWT | List all active IP bans |
| `DELETE` | `/bans/{ip}` | ✅ JWT | Unban an IP address |
| `GET` | `/health` | ❌ | Service + model status |
| `WS` | `/ws/dashboard` | ✅ JWT (first frame) | Live threat feed (10s cadence) |
| `GET` | `/` | ❌ | Serves the React dashboard SPA |

### WebSocket message shape
```json
{
  "rps": 342.1,
  "threat_level": "critical",
  "is_attack": true,
  "confidence": 0.97,
  "ban_ips": ["192.168.1.23", "192.168.1.10"],
  "rate_limit": 150,
  "requests_per_sec": 342.1,
  "unique_ips": 3,
  "top_k_avg": 890.3,
  "avg_payload": 512.0,
  "endpoint_entropy": 0.02,
  "event_count": 3421
}
```

---

## 🤖 ML Model

```
Input:  sequence of 10 feature snapshots (shape: [10, 6])
        │
        ▼
Conv1d(6→32, kernel=3, padding=1) → ReLU
        │
        ▼
Conv1d(32→64, kernel=3, padding=1) → ReLU
        │
        ▼
AdaptiveAvgPool1d(1) → Flatten
        │
        ▼
Linear(64 → 2)
        │
        ▼
Output: softmax([P(normal), P(attack)])
        confidence threshold: 0.85
```

**Feature vector (6 dimensions):**
| # | Feature | Normal Range | Attack Range |
|:---:|:---|:---:|:---:|
| 1 | `requests_per_sec` | 10–50 | 1000–9000 |
| 2 | `unique_ips` | 50–100 | 2–3 |
| 3 | `top_k_avg` | 2–8 | 500–4000 |
| 4 | `avg_payload` | 64–2048 | 512 (fixed) |
| 5 | `endpoint_entropy` | 1.5–2.3 | ~0 |
| 6 | `event_count` | 100–500 | 10k–50k |

---

## 🧪 Running Tests

```bash
# From the project root (outside Docker)
pip install pytest
pytest tests/ -v
```

```
tests/test_decision.py::test_no_attack_returns_false        PASSED
tests/test_decision.py::test_low_confidence_returns_false   PASSED
tests/test_decision.py::test_attack_bans_high_count_ips     PASSED
tests/test_decision.py::test_factory_creates_ddos_detector  PASSED
tests/test_decision.py::test_factory_unknown_type_raises    PASSED
tests/test_feature.py::test_empty_extractor_returns_empty   PASSED
tests/test_feature.py::test_add_event_increments_ip_count   PASSED
tests/test_feature.py::test_features_returns_correct_keys   PASSED
tests/test_feature.py::test_unique_ip_count                 PASSED
```

---

## ⚠️ Known Limitations

| Limitation | Detail |
|:---|:---|
| **Synthetic training data** | CNN trained on synthetic blobs — accuracy improves with real attack captures |
| **IPv4 only** | Trie and feature extractor support IPv4; IPv6 not yet implemented |
| **NAT false positives** | IPs behind shared NAT may be over-represented; rate limiting applies before hard bans |
| **Single admin account** | No user management — credentials are env-var configured |
| **C++ interceptor** | Standalone experiment; not yet integrated into the request path |

---

## 🛠️ Environment Variables

| Variable | Default | Description |
|:---|:---:|:---|
| `ADMIN_USER` | `admin` | Dashboard login username |
| `ADMIN_PASS` | `sentinel123` | Dashboard login password |
| `JWT_SECRET` | *(set in compose)* | HMAC-SHA256 signing key — **change in production** |
| `DB_HOST` | `postgres` | Postgres hostname |
| `DB_NAME` | `sentinelapi` | Database name |
| `DB_USER` | `sentinel` | Database user |
| `DB_PASSWORD` | `sentinel123` | Database password |

---

## 📝 Resume Line

> Built **SentinelAPI** — real-time DDoS detection gateway. C++ packet interception layer with Trie-based O(4) IP blocking and 8-thread pool. 1D-CNN (PyTorch) classifies 10-window traffic sequences as normal/attack. Feature extraction via sliding window, min-heap top-K, and Shannon entropy. PostgreSQL ACID audit log with connection pooling. JWT-authenticated WebSocket streams live threat data to a React SOC dashboard. Containerized with Docker Compose. pytest suite.

---

## 👤 Author

**Ojas** — 3rd Year CS Student

[![GitHub](https://img.shields.io/badge/GitHub-ojas4414-181717?style=flat&logo=github)](https://github.com/ojas4414)

---

<div align="center">

*Built with 🛡️ and too much coffee*

</div>
