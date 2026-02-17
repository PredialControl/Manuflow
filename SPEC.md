# ManuFlow - Sistema de Gestão Técnica

## 1. Project Overview

**Project Name:** ManuFlow  
**Type:** SaaS Web Application (PWA)  
**Core Functionality:** Professional technical maintenance management system for building and hospital contracts, with automated compliance alerts, technical rounds with photo documentation, and report versioning.  
**Target Users:** Building managers, maintenance technicians, supervisors, and system administrators in facilities management companies.

## 2. Technical Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS + shadcn/ui
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Authentication:** NextAuth.js
- **Email:** Resend API
- **PWA:** Next PWA
- **Architecture:** Clean Architecture (modules-based)

## 3. UI/UX Specification

### Layout Structure
- **Mobile-first** design (primary: 375px-768px)
- **Desktop:** Sidebar navigation (240px) + Main content
- **Responsive breakpoints:**
  - Mobile: < 768px (bottom navigation)
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### Visual Design

#### Color Palette
```css
--primary: #0F766E          /* Teal 700 - Main brand */
--primary-light: #14B8A6    /* Teal 500 */
--primary-dark: #0D5D56     /* Teal 800 */
--secondary: #1E293B        /* Slate 800 */
--accent: #F59E0B           /* Amber 500 - Warnings */
--danger: #DC2626           /* Red 600 - Critical */
--success: #16A34A          /* Green 600 - OK status */
--background: #F8FAFC       /* Slate 50 */
--surface: #FFFFFF          /* Cards/panels */
--border: #E2E8F0           /* Slate 200 */
--text-primary: #0F172A      /* Slate 900 */
--text-secondary: #64748B   /* Slate 500 */
```

#### Typography
- **Font Family:** Inter (Google Fonts)
- **Headings:**
  - H1: 32px/700
  - H2: 24px/600
  - H3: 20px/600
  - H4: 16px/600
- **Body:** 14px/400
- **Small:** 12px/400

#### Spacing System
- Base unit: 4px
- Common: 8px, 12px, 16px, 24px, 32px, 48px

### Components

#### Status Badges
- **OK:** Green background (#DCFCE7), green text (#16A34A)
- **Atenção:** Amber background (#FEF3C7), amber text (#D97706)
- **Crítico:** Red background (#FEE2E2), red text (#DC2626)
- **Em dia:** Green badge
- **Vencido:** Red badge
- **Pendente:** Gray badge

#### Cards
- White background, 8px border-radius
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 16px

#### Buttons
- Primary: Teal background, white text
- Secondary: White background, teal border
- Danger: Red background
- Height: 40px (desktop), 48px (mobile)

#### Form Inputs
- Height: 40px
- Border: 1px solid #E2E8F0
- Focus: 2px teal ring
- Border-radius: 6px

## 4. Database Schema (Prisma)

### Models

#### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  password      String
  role          Role      @default(TECHNICIAN)
  avatar        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  contracts     UserContract[]
  inspections   Inspection[]
  reports       Report[]
  auditLogs     AuditLog[]
}

enum Role {
  ADMIN
  SUPERVISOR
  TECHNICIAN
}
```

#### Contract
```prisma
model Contract {
  id              String    @id @default(cuid())
  name            String
  company         String
  logo            String?
  responsible     String
  email           String
  phone           String?
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  assets          Asset[]
  users           UserContract[]
  reports         Report[]
  inspections     Inspection[]
  emailQueue      EmailQueue[]
}
```

#### Asset
```prisma
model Asset {
  id              String    @id @default(cuid())
  contractId      String
  name            String
  type            AssetType
  location        String
  frequency       Frequency @default(MONTHLY)
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  contract        Contract  @relation(fields: [contractId], references: [id])
  scripts         AssetScript[]
  inspections     Inspection[]
  
  @@unique([contractId, name])
}

enum AssetType {
  GENERATOR
  PRIMARY_BOX
  WATER_TANK_UPPER
  WATER_TANK_LOWER
  STORM_DRAIN
  DRAINAGE_PIT
  BOOSTER_PUMP
  PRESSURIZER_PUMP
  OTHER
}

enum Frequency {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  SEMIANNUAL
  ANNUAL
}
```

#### AssetScript (Checklist)
```prisma
model AssetScript {
  id              String    @id @default(cuid())
  assetId         String
  order           Int
  question        String
  required        Boolean   @default(true)
  requirePhoto    Boolean   @default(false)
  
  asset           Asset     @relation(fields: [assetId], references: [id])
}
```

#### Inspection (Technical Round)
```prisma
model Inspection {
  id              String    @id @default(cuid())
  contractId      String
  assetId         String
  userId          String
  status          InspectionStatus @default(PENDING)
  notes           String?
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  contract        Contract  @relation(fields: [contractId], references: [id])
  asset           Asset     @relation(fields: [assetId], references: [id])
  user            User      @relation(fields: [userId], references: [id])
  steps           InspectionStep[]
  photos          Photo[]
}

enum InspectionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}
```

#### InspectionStep
```prisma
model InspectionStep {
  id              String    @id @default(cuid())
  inspectionId    String
  scriptId        String?
  question        String
  status          StepStatus @default(PENDING)
  requirePhoto    Boolean   @default(false)
  photoUrl        String?
  notes           String?
  completedAt     DateTime?
  
  inspection      Inspection @relation(fields: [inspectionId], references: [id])
}

enum StepStatus {
  PENDING
  OK
  WARNING
  CRITICAL
  SKIPPED
}
```

#### Report (Laudo)
```prisma
model Report {
  id              String    @id @default(cuid())
  contractId      String
  assetId         String?
  userId          String
  templateId      String?
  
  title           String
  executionDate   DateTime
  expirationDate  DateTime
  recurrence      RecurrenceType @default(MONTHLY)
  status          ReportStatus @default(DRAFT)
  
  technicalResponsible String
  crea             String
  signatureUrl     String?
  qrCode           String?
  
  notes            String?
  recommendations  String?
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  deletedAt        DateTime?
  
  contract         Contract  @relation(fields: [contractId], references: [id])
  asset            Asset?    @relation(fields: [assetId], references: [id])
  user             User      @relation(fields: [userId], references: [id])
  template         ReportTemplate? @relation(fields: [templateId], references: [id])
  versions         ReportVersion[]
  photos           Photo[]
}
```

#### ReportTemplate
```prisma
model ReportTemplate {
  id              String    @id @default(cuid())
  name            String
  category        ReportCategory
  description     String?
  frequency       Frequency @default(MONTHLY)
  
  checklist       Json
  requiredPhotos  String[]
  
  isDefault       Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  reports         Report[]
}

enum ReportCategory {
  ELECTRICAL
  FIRE
  HYDRAULIC
  HOSPITAL
  STRUCTURAL
}

enum RecurrenceType {
  MONTHLY
  QUARTERLY
  SEMIANNUAL
  ANNUAL
}

enum ReportStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  EXPIRED
  RENEWED
}
```

#### ReportVersion
```prisma
model ReportVersion {
  id              String    @id @default(cuid())
  reportId        String
  version         Int
  data            Json
  notes           String?
  createdAt       DateTime  @default(now())
  createdBy       String
  
  report          Report    @relation(fields: [reportId], references: [id])
  
  @@unique([reportId, version])
}
```

#### Photo
```prisma
model Photo {
  id              String    @id @default(cuid())
  url             String
  filename        String
  width           Int?
  height          Int?
  size            Int?
  
  inspectionId    String?
  reportId        String?
  reportVersionId String?
  
  createdAt       DateTime  @default(now())
  
  inspection      Inspection? @relation(fields: [inspectionId], references: [id])
  report          Report?    @relation(fields: [reportId], references: [id])
}
```

#### EmailQueue
```prisma
model EmailQueue {
  id              String    @id @default(cuid())
  contractId      String
  reportId        String?
  type            EmailType
  
  status          EmailStatus @default(PENDING)
  errorMessage    String?
  
  createdAt       DateTime  @default(now())
  sentAt          DateTime?
  
  contract        Contract  @relation(fields: [contractId], references: [id])
  report          Report?   @relation(fields: [reportId], references: [id])
}

enum EmailType {
  ALERT_60
  EXPIRED
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
}
```

#### AuditLog
```prisma
model AuditLog {
  id              String    @id @default(cuid())
  userId          String
  action          String
  entity          String
  entityId        String
  changes         Json?
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime  @default(now())
  
  user            User      @relation(fields: [userId], references: [id])
}
```

#### UserContract (Many-to-Many)
```prisma
model UserContract {
  userId          String
  contractId      String
  assignedAt      DateTime  @default(now())
  
  user            User      @relation(fields: [userId], references: [id])
  contract        Contract  @relation(fields: [contractId], references: [id])
  
  @@id([userId, contractId])
}
```

## 5. Feature Specification

### 5.1 Authentication
- Login with email/password
- NextAuth with credentials provider
- Role-based access control
- Session management

### 5.2 Contract Management
- Create/edit/archive contracts
- Assign users to contracts
- Custom logo upload
- Contact information management

### 5.3 Asset Management
- Create assets per contract
- Assign scripts/checklists
- Set inspection frequency
- Track asset history

### 5.4 Technical Rounds
- Select contract → asset → checklist
- Guided step-by-step inspection
- Status selection per step (OK/Atenção/Crítico)
- **Required photo capture** (camera only, no gallery)
- Auto-convert to WebP
- Auto-compress images
- Apply watermark:
  - Contract name
  - Asset name
  - Date/time
  - Technician name
- Filename format: `Contrato_Data_Hora_Tecnico_Ativo.webp`

### 5.5 Report System
- Pre-built templates for:
  - Electrical: SPDA, NR10, Termografia, Cabin, Aterramento
  - Fire: Sistema de incêndio, Bombas, Iluminação, Hidrantes
  - Hydraulic: Caixa d'água, Bombas, Drenagem
  - Hospital: Gases medicinais, Climatização, Pressão
  - Structural: Fachada, Cobertura, Estrutural, Impermeabilização
- Mandatory fields:
  - execution_date
  - expiration_date
  - recurrence_type
- Auto-calculate expiration
- Version control
- PDF generation with QR code

### 5.6 Kanban Board
- Columns: Atrasados | Em dia | Orçamento | Em andamento | Concluído
- Drag-and-drop status update
- Filter by asset/period

### 5.7 Dashboard
- Total reports
- Expiring in 60 days
- Expired
- Compliance index: (in_day / total) × 100
- Visual indicator:
  - Green: > 90%
  - Yellow: 70-89%
  - Red: < 70%

### 5.8 Email Automation
- Daily cron at 08:00
- Resend API integration
- Alert 60 days before expiration
- Alert when expired
- Rate limit: 100 emails/day
- EmailQueue table for tracking

### 5.9 History
- Timeline view per contract
- Filter by asset/period
- Download PDF
- Version history

### 5.10 PWA
- manifest.json
- Service worker
- Offline capability (read-only)
- Installable on iOS/Android

## 6. API Routes

### Auth
- POST /api/auth/register
- POST /api/auth/[...nextauth]

### Contracts
- GET/POST /api/contracts
- GET/PUT/DELETE /api/contracts/[id]

### Assets
- GET/POST /api/contracts/[id]/assets
- GET/PUT/DELETE /api/assets/[id]

### Inspections
- GET/POST /api/inspections
- GET/PUT /api/inspections/[id]
- POST /api/inspections/[id]/complete

### Reports
- GET/POST /api/reports
- GET/PUT /api/reports/[id]
- GET /api/reports/[id]/versions
- POST /api/reports/[id]/renew
- GET /api/reports/[id]/pdf

### Email
- POST /api/email/send
- GET /api/email/queue

### Cron
- POST /api/cron/alerts (protected by secret token)

## 7. Page Structure

```
/                           → Redirect to /dashboard or /login
/login                      → Login page
/register                   → Registration (admin only)
/dashboard                  → Main dashboard
/contracts                  → Contract list
/contracts/[id]             → Contract detail
/contracts/[id]/assets      → Asset management
/contracts/[id]/reports     → Report kanban
/contracts/[id]/history     → Report history
/contracts/new             → New contract
/inspections               → Inspection list
/inspections/[id]          → Execute inspection
/inspections/new           → Start inspection
/reports                    → All reports
/reports/[id]               → Report detail
/reports/[id]/edit          → Edit report
/templates                  → Template management (admin)
/users                      → User management (admin)
/settings                   → User settings
```

## 8. Acceptance Criteria

1. ✅ User can register and login with different roles
2. ✅ Admin can create/edit/archive contracts
3. ✅ Admin can create custom assets with checklists
4. ✅ Technician can execute rounds with mandatory photos
5. ✅ Photos are automatically converted to WebP with watermark
6. ✅ System prevents completion without photo
7. ✅ Reports have mandatory dates and auto-calculated expiration
8. ✅ Kanban board allows drag-and-drop status changes
9. ✅ Dashboard shows compliance index with color coding
10. ✅ Email alerts are sent via Resend (60 days before + expired)
11. ✅ Cron job runs daily at 08:00
12. ✅ PDF generation includes QR code
13. ✅ Reports are versioned (no hard delete)
14. ✅ PWA is installable
15. ✅ All routes are protected by role-based middleware
