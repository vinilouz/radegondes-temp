# Brownfield Architecture Document
# Radegondes - Study Management Platform

## Architecture Overview

Radegondes follows a modern three-tier architecture pattern with containerized microservices, implementing a MERN stack (MongoDB, Express.js, React, Node.js) with Docker orchestration for deployment and scalability.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  React SPA (Frontend)                                           │
│  ├── React Router (Navigation)                                  │
│  ├── Context API (State Management)                             │
│  ├── Axios (HTTP Client)                                        │
│  └── JWT Token Management                                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/HTTP
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Nginx Reverse Proxy                                           │
│  ├── Static File Serving                                       │
│  ├── API Request Routing                                        │
│  ├── GZIP Compression                                          │
│  └── Security Headers                                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Node.js + Express.js API Server                               │
│  ├── Authentication Middleware (JWT)                           │
│  ├── CORS Configuration                                        │
│  ├── File Upload Handler (Multer)                              │
│  ├── Route Controllers                                         │
│  └── Business Logic Services                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ MongoDB Protocol
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB Database                                               │
│  ├── User Collection                                           │
│  ├── Study Plans Collection                                    │
│  ├── Disciplines Collection                                    │
│  ├── Study Records Collection                                  │
│  ├── Reviews Collection                                        │
│  └── Administrative Collections                                │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack Architecture

### Frontend Architecture

#### Core Technologies
- **React 18**: Component-based UI library with hooks
- **React Router DOM**: Client-side routing and navigation
- **Vite**: Build tool and development server
- **Axios**: HTTP client for API communication

#### State Management Pattern
```
Application State Architecture:

┌─────────────────────┐    ┌─────────────────────┐
│   React Context    │────│   Local Storage    │
│   (Global State)   │    │   (Persistence)    │
└─────────────────────┘    └─────────────────────┘
           │
           ▼
┌─────────────────────┐    ┌─────────────────────┐
│  Component State   │────│   Session Storage   │
│   (Local State)    │    │   (Temporary Data)  │
└─────────────────────┘    └─────────────────────┘
```

#### Component Architecture
```
Component Hierarchy:

App
├── AuthProvider (Context)
├── Router
│   ├── PublicRoutes
│   │   ├── LoginForm
│   │   └── RegisterForm
│   └── ProtectedRoutes
│       ├── MainLayout
│       │   ├── Sidebar
│       │   ├── Breadcrumb
│       │   └── Content Area
│       ├── Dashboard
│       ├── StudyPlans
│       └── AdminPanel
└── GlobalModals
    ├── PerfilModal
    ├── ConfirmModal
    └── StudySessionModal
```

### Backend Architecture

#### API Layer Structure
```
Express.js Application Structure:

index.js (Entry Point)
├── Middleware Stack
│   ├── CORS Configuration
│   ├── JSON Body Parser
│   ├── Authentication Middleware
│   └── File Upload Middleware
├── Route Handlers
│   ├── Authentication Routes (/api/auth/*)
│   ├── User Management (/api/users/*)
│   ├── Study Plans (/api/planos/*)
│   ├── Admin Routes (/api/admin/*)
│   └── Public Routes (/api/public/*)
└── Error Handling Middleware
```

#### Data Access Layer
```
Mongoose ODM Architecture:

Models Layer:
├── User.js (Authentication & Profile)
├── Plano.js (Study Plans)
├── Disciplina.js (Disciplines)
├── RegistroEstudo.js (Study Records)
├── Revisao.js (Review Sessions)
├── Instituicao.js (Institutions)
├── Edital.js (Competitive Exams)
├── Categoria.js (Categories)
└── Cargo.js (Positions)

Database Relationships:
User ──┬── Plano (1:N)
       └── RegistroEstudo (1:N)

Plano ──┬── Disciplina (N:N)
        └── RegistroEstudo (1:N)

Disciplina ──┬── Categoria (N:1)
             └── Edital (N:N)

Edital ── Instituicao (N:1)
```

## Security Architecture

### Authentication Flow
```
JWT Authentication Pattern:

1. User Login Request
   ├── Email/Password Validation
   ├── bcrypt Password Verification
   └── JWT Token Generation

2. Token Storage
   ├── Client-side: localStorage
   └── Server-side: Stateless (no session)

3. Protected Route Access
   ├── Token Extraction from Headers
   ├── JWT Signature Verification
   ├── Token Expiration Check
   └── User Context Injection

4. Token Refresh Strategy
   └── Manual re-authentication (current)
```

### Security Layers
- **Password Security**: bcrypt hashing with salt rounds
- **API Security**: JWT token validation middleware
- **CORS Policy**: Configured for specific origins
- **Input Validation**: Mongoose schema validation
- **File Upload Security**: Multer with file type restrictions

## Data Architecture

### Database Design Patterns

#### Document Structure Strategy
```
MongoDB Collection Design:

1. Embedded Documents (Performance Optimized)
   ├── User Preferences (embedded in User)
   ├── Study Statistics (calculated fields)
   └── Topic Lists (embedded in Disciplines)

2. Referenced Documents (Normalized)
   ├── User ↔ Study Plans (ObjectId references)
   ├── Plans ↔ Disciplines (ObjectId arrays)
   └── Study Records ↔ Users/Plans (ObjectId references)

3. Hybrid Approach (Denormalized for Performance)
   ├── Discipline Name cached in Study Records
   ├── User Name cached in Reviews
   └── Institution Name cached in Editals
```

#### Indexing Strategy
```
Database Indexes:

Primary Indexes:
├── User.email (unique)
├── Plano.usuario + Plano.nome (compound)
├── RegistroEstudo.usuario + RegistroEstudo.data (compound)
└── Revisao.usuario + Revisao.dataInicio (compound)

Secondary Indexes:
├── Disciplina.categoria
├── Edital.instituicao
└── User.role (admin queries)
```

### Data Flow Architecture

```
Data Flow Patterns:

1. Read Operations (Query Pattern)
   Client Request → API Route → Controller → Model → MongoDB
   MongoDB → Model → Controller → JSON Response → Client

2. Write Operations (Command Pattern)
   Client Data → Validation → Business Logic → Model Save → MongoDB
   MongoDB Response → Success/Error → Client Notification

3. File Upload Flow
   Client File → Multer Middleware → File System → Database Path
   Database Path → Static File Serving → Client Display
```

## Deployment Architecture

### Containerization Strategy

#### Docker Architecture
```
Container Orchestration:

┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend Container (Nginx + React Build)                  │
│  ├── Multi-stage Build (Node.js → Nginx)                   │
│  ├── Static Asset Serving                                  │
│  └── API Proxy Configuration                               │
├─────────────────────────────────────────────────────────────┤
│  Backend Container (Node.js + Express)                     │
│  ├── Application Code                                      │
│  ├── File Upload Volume                                    │
│  └── Environment Configuration                             │
├─────────────────────────────────────────────────────────────┤
│  Database Container (MongoDB)                              │
│  ├── Data Persistence Volume                               │
│  ├── Database Initialization                               │
│  └── Health Check Configuration                            │
└─────────────────────────────────────────────────────────────┘
```

#### Environment Configuration
```
Environment Strategy:

Development (docker-compose.local.yml):
├── Hot Reload Enabled
├── Debug Logging
├── Local File Volumes
└── Development Database

Production (docker-compose.yml):
├── Optimized Builds
├── Environment Variables
├── Persistent Volumes
└── Health Checks
```

### Network Architecture

```
Network Topology:

External Network:
├── Port 80/443 (Frontend - Nginx)
└── Internal Docker Network

Internal Network:
├── Frontend Container (Port 80)
├── Backend Container (Port 5000)
└── Database Container (Port 27017)

Volume Mounts:
├── Frontend: Static builds
├── Backend: File uploads
└── Database: Data persistence
```

## Performance Architecture

### Optimization Strategies

#### Frontend Performance
```
Client-Side Optimization:

1. Code Splitting
   ├── Route-based splitting (React.lazy)
   ├── Component lazy loading
   └── Dynamic imports

2. Asset Optimization
   ├── Vite build optimization
   ├── Image compression
   └── Font optimization

3. Caching Strategy
   ├── Browser caching (static assets)
   ├── localStorage (user preferences)
   └── sessionStorage (temporary data)
```

#### Backend Performance
```
Server-Side Optimization:

1. Database Optimization
   ├── Query optimization with indexes
   ├── Aggregation pipelines
   └── Connection pooling

2. API Performance
   ├── Response compression (gzip)
   ├── Efficient data serialization
   └── Minimal data transfer

3. Memory Management
   ├── Mongoose connection management
   ├── File upload cleanup
   └── Memory leak prevention
```

## Scalability Architecture

### Horizontal Scaling Considerations

```
Scaling Strategy:

Current Architecture (Single Instance):
├── Single Frontend Container
├── Single Backend Container
└── Single Database Instance

Future Scaling Options:
├── Load Balancer (Nginx/HAProxy)
├── Multiple Backend Instances
├── Database Replication (Master/Slave)
└── CDN for Static Assets
```

### Microservices Migration Path

```
Microservices Decomposition Strategy:

1. Authentication Service
   ├── User management
   ├── JWT token handling
   └── Role-based access

2. Study Management Service
   ├── Study plans
   ├── Disciplines
   └── Progress tracking

3. Analytics Service
   ├── Study statistics
   ├── Performance metrics
   └── Reporting

4. Content Management Service
   ├── Institutions
   ├── Editals
   └── Categories
```

## Monitoring and Observability

### Current Monitoring Gaps
```
Monitoring Requirements:

1. Application Monitoring
   ├── Error tracking (not implemented)
   ├── Performance metrics (not implemented)
   └── User analytics (not implemented)

2. Infrastructure Monitoring
   ├── Container health (basic Docker health checks)
   ├── Database performance (not implemented)
   └── Network monitoring (not implemented)

3. Logging Strategy
   ├── Application logs (console.log only)
   ├── Access logs (Nginx basic)
   └── Error logs (basic error handling)
```

### Recommended Monitoring Architecture
```
Observability Stack (Future Implementation):

┌─────────────────────┐    ┌─────────────────────┐
│   Application      │────│    Log Aggregation  │
│   (Winston/Pino)   │    │    (ELK/Loki)      │
└─────────────────────┘    └─────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Metrics          │────│    Visualization    │
│   (Prometheus)     │    │    (Grafana)       │
└─────────────────────┘    └─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   Alerting         │
│   (AlertManager)   │
└─────────────────────┘
```

## Integration Architecture

### API Design Patterns

#### RESTful API Structure
```
API Endpoint Organization:

/api/auth/*          (Authentication)
├── POST /login
├── POST /register
└── GET /dashboard

/api/users/*         (User Management)
├── GET /users
├── POST /users
├── PUT /users/:id
└── DELETE /users/:id

/api/planos/*        (Study Plans)
├── GET /planos
├── POST /planos
├── GET /planos/:id
├── PUT /planos/:id
└── DELETE /planos/:id

/api/admin/*         (Administrative)
├── GET /admin/categorias
├── GET /admin/disciplinas
├── GET /admin/editais
└── GET /admin/instituicoes
```

#### Response Patterns
```
API Response Structure:

Success Response:
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}

Error Response:
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}

Paginated Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Quality Architecture

### Testing Strategy

```
Testing Pyramid:

┌─────────────────────┐
│   E2E Tests        │  (Planned - Not Implemented)
│   (Cypress/Jest)   │
├─────────────────────┤
│   Integration      │  (Planned - Not Implemented)
│   Tests            │
├─────────────────────┤
│   Unit Tests       │  (Planned - Not Implemented)
│   (Jest/Vitest)    │
└─────────────────────┘

Current State: No automated testing implemented
Recommended: Implement bottom-up testing strategy
```

### Code Quality Measures
```
Code Quality Tools:

Frontend:
├── ESLint (configured)
├── Prettier (not configured)
└── TypeScript (not implemented)

Backend:
├── ESLint (not configured)
├── Prettier (not configured)
└── TypeScript (not implemented)

Recommended Additions:
├── Husky (pre-commit hooks)
├── lint-staged (staged file linting)
└── SonarQube (code analysis)
```

## Migration and Evolution Strategy

### Technical Debt Priorities

```
Immediate Priorities (0-3 months):
1. Implement comprehensive error handling
2. Add input validation and sanitization
3. Implement automated testing
4. Add structured logging
5. Optimize database queries

Medium-term Goals (3-6 months):
1. Implement caching strategy
2. Add monitoring and alerting
3. Optimize performance bottlenecks
4. Implement CI/CD pipeline
5. Add API documentation

Long-term Vision (6+ months):
1. Microservices architecture
2. Real-time features (WebSockets)
3. Mobile application
4. Advanced analytics
5. Machine learning integration
```

### Architecture Evolution Path

```
Evolution Roadmap:

Phase 1: Stabilization
├── Testing implementation
├── Error handling
├── Performance optimization
└── Security hardening

Phase 2: Enhancement
├── Real-time features
├── Advanced caching
├── API versioning
└── Mobile support

Phase 3: Transformation
├── Microservices migration
├── Event-driven architecture
├── Advanced analytics
└── AI/ML integration
```

## Conclusion

The Radegondes platform demonstrates a solid foundational architecture with modern technologies and containerized deployment. The current monolithic MERN stack provides a good balance of simplicity and functionality for the current scale.

Key architectural strengths include:
- Clean separation of concerns
- Modern technology stack
- Containerized deployment
- RESTful API design
- Document-based data modeling

Primary areas for architectural improvement:
- Comprehensive testing strategy
- Enhanced monitoring and observability
- Performance optimization
- Security hardening
- Scalability preparation

The architecture is well-positioned for future growth and can evolve incrementally toward a more distributed, scalable, and resilient system as requirements expand.