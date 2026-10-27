-- ============================================================================
-- IntraNerd · Esquema de base de datos (SQLite)
-- Se ejecuta de forma idempotente al iniciar el servidor.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Módulo 1 · Notas y asignaturas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  student_name TEXT NOT NULL,
  teacher_name TEXT,
  color        TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subjects_student ON subjects (student_name);

CREATE TABLE IF NOT EXISTS grades (
  id         TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
  semester   INTEGER NOT NULL CHECK (semester IN (1, 2)),
  value      REAL NOT NULL CHECK (value >= 1.0 AND value <= 7.0),
  label      TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades (subject_id, semester);

-- ---------------------------------------------------------------------------
-- Módulo 2 · Personas extraviadas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS missing_persons (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  age                INTEGER CHECK (age IS NULL OR (age >= 0 AND age <= 120)),
  description        TEXT NOT NULL,
  last_seen_place    TEXT NOT NULL,
  contact            TEXT NOT NULL,
  photo_url          TEXT,
  example_image_url  TEXT,
  status             TEXT NOT NULL DEFAULT 'MISSING' CHECK (status IN ('MISSING', 'FOUND')),
  found_at           TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_missing_status ON missing_persons (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_missing_name ON missing_persons (name);

-- ---------------------------------------------------------------------------
-- Módulo 3 · Profesores y reseñas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  subject    TEXT,
  photo_url  TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers (name);
CREATE INDEX IF NOT EXISTS idx_teachers_subject ON teachers (subject);

CREATE TABLE IF NOT EXISTS teacher_reviews (
  id            TEXT PRIMARY KEY,
  teacher_id    TEXT NOT NULL REFERENCES teachers (id) ON DELETE CASCADE,
  student_name  TEXT NOT NULL,
  content       TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  evidence_url  TEXT,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_teacher ON teacher_reviews (teacher_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Módulo 4 · Objetos perdidos y encontrados
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lost_found_items (
  id                 TEXT PRIMARY KEY,
  item_type          TEXT NOT NULL CHECK (item_type IN ('FOUND', 'LOST')),
  reported_by        TEXT NOT NULL,
  contact            TEXT NOT NULL,
  description        TEXT NOT NULL,
  location           TEXT,
  category           TEXT,
  photo_url          TEXT,
  example_image_url  TEXT,
  status             TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLAIMED', 'RETURNED')),
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lost_found_type ON lost_found_items (item_type, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Módulo 5 · Calendario escolar
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  subject     TEXT,
  event_date  TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('STUDENT', 'TEACHER')),
  author_name TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events (event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_role ON calendar_events (role);

-- ---------------------------------------------------------------------------
-- Módulo 6 · Talleres e inscripciones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshops (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  schedule     TEXT,
  location     TEXT,
  teacher_name TEXT,
  capacity     INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 500),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workshops_name ON workshops (name);

CREATE TABLE IF NOT EXISTS workshop_enrollments (
  id           TEXT PRIMARY KEY,
  workshop_id  TEXT NOT NULL REFERENCES workshops (id) ON DELETE CASCADE,
  student_name TEXT NOT NULL COLLATE NOCASE,
  student_email TEXT,
  course       TEXT,
  created_at   TEXT NOT NULL,
  UNIQUE (workshop_id, student_name)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_workshop ON workshop_enrollments (workshop_id);

-- ---------------------------------------------------------------------------
-- Módulo 7 · Tablón de anuncios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'GENERAL'
              CHECK (category IN ('GENERAL', 'URGENT', 'EVENT', 'SUSPENSION', 'ACADEMIC')),
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'DIRECTION',
  pinned      INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_feed
  ON announcements (pinned DESC, created_at DESC);

-- ---------------------------------------------------------------------------
-- Módulo 8 · Tareas y checklist personal
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  subject     TEXT NOT NULL,
  priority    TEXT,
  due_date    TEXT,
  created_by  TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks (subject);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);

CREATE TABLE IF NOT EXISTS task_completions (
  id           TEXT PRIMARY KEY,
  task_id      TEXT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  student_name TEXT NOT NULL COLLATE NOCASE,
  completed    INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  completed_at TEXT,
  updated_at   TEXT NOT NULL,
  UNIQUE (task_id, student_name)
);

CREATE INDEX IF NOT EXISTS idx_completions_task ON task_completions (task_id);
