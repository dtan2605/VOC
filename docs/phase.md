Dựa trên kiến trúc hiện tại của bạn gồm:

* React Frontend
* ASP.NET Core Microservices
* FastAPI AI Services
* RabbitMQ
* Redis
* MySQL
* Docker
* DevOps + CI/CD
* Recommendation AI
* Pronunciation + NLP
* Infrastructure + Monitoring

thì cách triển khai tối ưu KHÔNG phải làm tất cả cùng lúc.

Kiến trúc này nên triển khai theo hướng:

```text
MVP First
→ Stable Core
→ AI Integration
→ Optimization
→ Scale
```



---

# ROADMAP TỔNG THỂ

| Phase   | Thời gian | Mục tiêu                |
| ------- | --------- | ----------------------- |
| Phase 0 | 1 tuần    | Setup nền tảng          |
| Phase 1 | 2 tuần    | MVP Core Backend        |
| Phase 2 | 2 tuần    | Frontend MVP            |
| Phase 3 | 2 tuần    | Learning System         |
| Phase 4 | 2 tuần    | AI Integration          |
| Phase 5 | 1 tuần    | Recommendation          |
| Phase 6 | 1 tuần    | Analytics + Dashboard   |
| Phase 7 | 1 tuần    | Testing + Optimization  |
| Phase 8 | 1 tuần    | Deployment + Production |

---


# PHASE 0 — PROJECT FOUNDATION

## Thời gian

```text
1 tuần
```

---

# Sprint 0.1 — Repository + Structure

## Mục tiêu

Setup toàn bộ kiến trúc monorepo.

## Tasks

### Frontend

* React + TypeScript
* ESLint
* Prettier
* React Router
* Redux Toolkit

### Backend

* ASP.NET solution
* Shared libraries
* API Gateway
* Dockerfile
* API contract / OpenAPI design
* Basic logging and health check endpoints

### AI Services

* FastAPI base service
* shared package
* Docker setup
* Swagger/OpenAPI contract for AI endpoints

### Database

* Migration system setup
* Seed data for dev environment
* Local DB initialization scripts

### Testing

* Unit test setup
* Integration test setup
* CI test pipeline

### DevOps

* Docker Compose
* Redis
* RabbitMQ
* MySQL
* MinIO
* Basic monitoring/metrics readiness

### Docs

* README
* Architecture
* SRS
* API contract documentation

---

# Deliverables

```text
Project compile được
Docker chạy được
Swagger hoạt động
Frontend chạy được
Unit/integration tests chạy được
DB migration và seed data thực thi được
API contract/swagger cụ thể
Basic logging và health check hoạt động
```

---

# Sprint 0.2 — CI/CD Foundation

## Tasks

* GitHub Actions
* branch strategy
* PR rules
* lint pipeline
* backend build pipeline
* frontend build pipeline

---

# Deliverables

```text
Auto build khi push code
```

---

# PHASE 1 — CORE BACKEND MVP

## Thời gian

```text
2 tuần
```

---

# Sprint 1.1 — Authentication System

## Services

```text
AuthService
UserService
```



---

## Tasks

### Backend

* JWT auth
* Register/Login
* Refresh token
* Role system
* User profile

### Database

* users
* refresh_tokens
* roles

### Frontend

* login page
* register page
* auth context
* protected routes

---

# Deliverables

```text
Đăng nhập hoạt động
JWT hoạt động
```

---

# Sprint 1.2 — Vocabulary Core

## Services

```text
VocabularyService
```



---

## Tasks

### Backend

* CRUD vocabulary
* CRUD topic
* CRUD band
* pagination
* filtering

### Database

* vocabularies
* topics
* bands
* examples

### Frontend

* vocabulary page
* add/edit vocabulary
* search vocabulary

---

# Deliverables

```text
User thêm từ được
Search được
Filter band được
```

---

# PHASE 2 — FRONTEND MVP

## Thời gian

```text
2 tuần
```

---

# Sprint 2.1 — UI System

## Tasks

### Frontend

* Main layout
* Dashboard layout
* Responsive UI
* Theme system
* Navigation

---

# Sprint 2.2 — Vocabulary UX

## Tasks

* Vocabulary detail page
* pronunciation button
* flashcard UI
* band progress UI

---

# Deliverables

```text
UI usable hoàn chỉnh
```

---

# PHASE 3 — LEARNING SYSTEM

## Thời gian

```text
2 tuần
```

---

# Sprint 3.1 — Learning Engine

## Services

```text
LearningService
```

---

## Tasks

### Backend

* learning session
* review history
* mastery score
* learning progress

### Database

* learning_sessions
* review_history
* mastery_scores

### Frontend

* learning page
* review page
* progress tracking

---

# Sprint 3.2 — Review System

## Tasks

* EN → VI
* VI → EN
* typing answer
* answer validation
* streak system

---

# Deliverables

```text
User học từ được hoàn chỉnh
```

---

# PHASE 4 — AI INTEGRATION

## Thời gian

```text
2 tuần
```

---

# Sprint 4.1 — NLP Service

## Services

```text
nlp-service
translation-service
```



---

## Tasks

### AI

* POS tagging
* lemma
* IPA generation
* tokenizer
* translation API

### Backend

* integrate FastAPI client
* RabbitMQ event
* async processing

### Frontend

* auto-fill word info

---

# Deliverables

```text
User nhập từ
→ tự sinh:
- loại từ
- IPA
- nghĩa
- ví dụ
```

---

# Sprint 4.2 — Pronunciation Service

## Services

```text
pronunciation-service
```



---

## Tasks

### AI

* gTTS
* MP3 generation
* audio storage
* accent support

### Infrastructure

* MinIO integration

### Frontend

* play pronunciation audio

---

# Deliverables

```text
Có audio pronunciation
```

---

# PHASE 5 — RECOMMENDATION SYSTEM

## Thời gian

```text
1 tuần
```

---

# Sprint 5.1 — Recommendation AI

## Services

```text
recommendation-service
```



---

## Tasks

### AI

* forgetting curve
* recommendation engine
* mastery prediction

### Backend

* recommendation API

### Frontend

* recommended words
* weak topics

---

# Deliverables

```text
AI gợi ý từ cần học
```

---

# PHASE 6 — ANALYTICS + DASHBOARD

## Thời gian

```text
1 tuần
```

---

# Sprint 6.1 — Analytics

## Services

```text
AnalyticsService
```

---

## Tasks

### Backend

* study statistics
* streak analytics
* mastery analytics

### Frontend

* charts
* dashboard
* progress graphs

---

# Deliverables

```text
Dashboard hoàn chỉnh
```

---

# PHASE 7 — TESTING + OPTIMIZATION

## Thời gian

```text
1 tuần
```

---

# Sprint 7.1 — Backend Testing

## Tasks

### Backend

* unit tests
* integration tests
* API tests

### AI

* model validation
* response benchmark

### Frontend

* UI testing
* responsive testing

---

# Sprint 7.2 — Performance

## Tasks

* Redis cache
* DB indexing
* RabbitMQ optimization
* lazy loading
* code splitting

---

# Deliverables

```text
System stable
```

---

# PHASE 8 — DEPLOYMENT + PRODUCTION

## Thời gian

```text
1 tuần
```

---

# Sprint 8.1 — Production Deployment

## Tasks

### DevOps

* production docker compose
* nginx reverse proxy
* SSL
* CI/CD deploy

### Monitoring

* Prometheus
* Grafana
* logging

---

# Deliverables

```text
Production ready
```

---

# THỨ TỰ ƯU TIÊN ĐÚNG

## PHẢI LÀM TRƯỚC

```text
Auth
Vocabulary
Learning
```

---

## LÀM SAU

```text
AI
Recommendation
Analytics
```

# GIT WORKFLOW

## Branch Strategy

```text
main
develop
feature/*
hotfix/*
```

---

# Ví dụ

```text
feature/auth
feature/vocabulary
feature/recommendation
```

---

# Quy trình đúng

```text
feature/*
→ develop
→ main
```

---

# Definition Of Done (DOD)

Mỗi sprint chỉ complete khi:

* code review xong
* unit test pass
* docker build pass
* swagger update
* frontend responsive
* không có critical bug

---

# RISK LỚN NHẤT CỦA PROJECT

## 1. Làm microservice quá sớm

Khuyến nghị:

```text
Modular Monolith trước
```

---

## 2. AI quá phức tạp

Ban đầu dùng:

* gTTS
* Google Translate
* spaCy
* sentence-transformers

---

## 3. Kubernetes quá sớm

Ban đầu chỉ:

```text
Docker Compose
```

---

# ROADMAP SCALE SAU MVP

## Version 2

* speech recognition
* spaced repetition AI
* mobile app
* websocket realtime

---

## Version 3

* AI chatbot tutor
* AI pronunciation scoring
* adaptive learning
* gamification system
