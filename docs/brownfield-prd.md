# Brownfield Product Requirements Document (PRD)
# Radegondes - Study Management Platform

## Executive Summary

Radegondes is a comprehensive study management platform designed for competitive exam preparation in Brazil. The application provides users with tools to create study plans, manage disciplines and topics, track study progress, schedule study sessions, and monitor performance through detailed analytics.

## Current System Architecture

### Technology Stack
- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: React.js with React Router
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer for avatar and logo management
- **Deployment**: Docker containers with Docker Compose
- **Web Server**: Nginx for frontend serving and API proxying

### Infrastructure
- **Development Environment**: Docker Compose with MongoDB, Backend, and Frontend services
- **Production Environment**: Coolify-based deployment with environment variables
- **File Storage**: Local file system for avatars and institution logos
- **Security**: CORS enabled, JWT-based authentication, bcrypt password hashing

## Current Feature Set

### 1. User Management
- **User Registration & Authentication**
  - Email-based registration with password hashing
  - JWT token-based authentication
  - User profile management with avatar upload
  - Personal preferences (study days, available periods, first day of week, audio alerts)
  - Admin role management

- **User Profile Features**
  - Personal data management (name, birthday, gender, city, state)
  - Study preferences configuration
  - Password change functionality
  - Last login tracking

### 2. Study Plan Management
- **Study Plan Creation**
  - Custom study plan creation with name and description
  - Association with multiple disciplines
  - Study statistics calculation (topics studied, questions solved, total hours)

- **Study Plan Features**
  - Dashboard with progress overview
  - Discipline management within plans
  - Study session scheduling
  - Progress tracking and analytics

### 3. Discipline & Topic Management
- **Discipline Structure**
  - Discipline creation with name and color coding
  - Topic organization within disciplines
  - Association with institutions and editals (competitive exams)
  - Color-coded visual organization

- **Topic Management**
  - Individual topic tracking
  - Study status management (not studied, studied today, already studied, scheduled)
  - Topic-specific study sessions
  - Progress indicators

### 4. Study Session Management
- **Study Session Features**
  - Timer-based study sessions
  - Study material tracking
  - Question planning and completion tracking
  - Study notes and comments
  - Link management for study resources
  - Session completion marking

- **Study Records**
  - Detailed study history per topic
  - Time tracking with start/end timestamps
  - Question statistics (planned vs. completed)
  - Study material documentation
  - Session finalization status

### 5. Administrative Features
- **Institution Management**
  - Institution creation with logos
  - Edital (competitive exam) management
  - Category organization
  - Public statistics for editals

- **User Administration**
  - User role management (admin/user)
  - User CRUD operations
  - Admin dashboard access

- **Content Management**
  - Discipline administration
  - Category management
  - Edital management with discipline associations

### 6. Analytics & Reporting
- **Study Statistics**
  - Total study time per discipline/topic
  - Question completion rates
  - Study session history
  - Progress visualization

- **Dashboard Features**
  - Recent study activity
  - Study plan overview
  - Performance metrics
  - Study schedule visualization

## Data Models

### User Model
```javascript
{
  nome: String,
  sobrenome: String,
  dataAniversario: Date,
  genero: String,
  cidade: String,
  estado: String,
  email: String (unique),
  password: String (hashed),
  role: String (default: 'user'),
  avatar: String,
  diasEstudo: [String],
  periodosDisponiveis: [String],
  primeiroDiaSemana: String,
  audioAlerta: Boolean,
  createdAt: Date,
  lastLogin: Date
}
```

### Study Record Model
```javascript
{
  titulo: String,
  links: [Object],
  questoesPlanejadas: Number,
  questoesRealizadas: Number,
  tipoAtividade: String,
  material: String,
  estudoFinalizado: Boolean,
  marcarComoEstudado: Boolean,
  dataOpcao: String,
  dataAgendada: Date,
  horarioAgendado: String,
  data: Date,
  iniciadaEm: Date,
  finalizadaEm: Date,
  createdAt: Date
}
```

### Review Model
```javascript
{
  topico: String,
  disciplinaId: ObjectId,
  disciplinaNome: String,
  planoId: ObjectId,
  usuario: ObjectId,
  dataInicio: Date,
  cor: String,
  ativo: Boolean,
  dataFinalizacao: Date
}
```

## API Endpoints

### Authentication Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/dashboard` - Dashboard data (protected)

### User Management
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Study Plan Management
- `GET /api/planos` - Get user's study plans
- `POST /api/planos` - Create study plan
- `GET /api/planos/:id` - Get specific study plan
- `PUT /api/planos/:id` - Update study plan
- `DELETE /api/planos/:id` - Delete study plan

### Discipline Management
- `PUT /api/planos/:planoId/disciplinas/:disciplinaId` - Update discipline
- `DELETE /api/planos/:planoId/disciplinas/:disciplinaId` - Remove discipline
- `POST /api/planos/:planoId/disciplinas` - Add discipline to plan

### Administrative Endpoints
- `GET /api/admin/categorias` - Manage categories
- `GET /api/admin/disciplinas` - Manage disciplines
- `GET /api/admin/editais` - Manage editals
- `GET /api/admin/instituicoes` - Manage institutions

### Public Endpoints
- `GET /api/categorias` - Public categories
- `GET /api/instituicoes` - Public institutions
- `GET /api/edital/:nome/stats` - Public edital statistics

## Current User Interface

### Layout Structure
- **Main Layout**: Sidebar navigation with breadcrumb system
- **Responsive Design**: Mobile-friendly interface
- **Dark Mode**: Comprehensive dark theme implementation
- **Modal System**: Overlay modals for forms and confirmations

### Key Components
- **DataTable**: Reusable table with search, pagination, and actions
- **ColorPicker**: Color selection for disciplines
- **ConfirmModal**: Confirmation dialogs with different types
- **LoginForm**: Authentication interface
- **PerfilModal**: User profile management

### Navigation Structure
- Dashboard
- Study Plans
- Admin Panel (for admin users)
  - User Management
  - Institution Management
  - Edital Management
  - Discipline Management
  - Category Management

## Current Business Logic

### Study Session Workflow
1. User selects a topic from a discipline
2. System opens study session modal
3. User can start timer, add materials, plan questions
4. System tracks study time and progress
5. User can mark session as completed
6. System saves study record with all details

### Progress Calculation
- **Topics Studied**: Count of topics with study records
- **Questions Solved**: Sum of completed questions across all sessions
- **Total Study Hours**: Sum of study time across all sessions
- **Completion Status**: Based on study finalization flags

### Scheduling System
- Users can schedule study sessions for future dates
- System tracks scheduled vs. completed sessions
- Visual indicators for overdue and upcoming sessions

## Technical Debt & Areas for Improvement

### Performance Issues
- Large data fetching without pagination in some areas
- Multiple API calls for related data
- Client-side data processing for statistics

### Code Quality
- Inconsistent error handling patterns
- Mixed state management approaches
- Some components with high complexity

### Security Considerations
- File upload validation needs enhancement
- Rate limiting not implemented
- Input sanitization could be improved

### User Experience
- Loading states inconsistently implemented
- Error messages could be more user-friendly
- Mobile responsiveness needs refinement

## Deployment & Operations

### Current Deployment
- Docker-based containerization
- Environment-specific configuration
- Nginx reverse proxy setup
- MongoDB persistence

### Monitoring & Logging
- Basic console logging
- No structured logging system
- No application monitoring
- No error tracking system

## Recommendations for Future Development

### Short-term Improvements
1. Implement comprehensive error handling
2. Add loading states throughout the application
3. Optimize API calls and add pagination
4. Enhance mobile responsiveness
5. Add input validation and sanitization

### Medium-term Enhancements
1. Implement real-time notifications
2. Add data export functionality
3. Create mobile application
4. Implement advanced analytics
5. Add collaborative study features

### Long-term Vision
1. AI-powered study recommendations
2. Integration with external learning platforms
3. Gamification features
4. Advanced reporting and insights
5. Multi-language support

## Conclusion

Radegondes is a well-structured study management platform with a solid foundation for competitive exam preparation. The current implementation provides essential features for study planning, progress tracking, and administrative management. The modular architecture and comprehensive API design provide a good foundation for future enhancements and scalability.

The platform successfully addresses the core needs of Brazilian competitive exam candidates by providing tools for organized study planning, progress tracking, and performance analytics. With the recommended improvements, it can become an even more powerful and user-friendly study management solution.