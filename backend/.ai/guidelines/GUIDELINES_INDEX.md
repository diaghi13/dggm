# DGGM ERP - Guidelines Index

**Purpose**: Navigation map for all project documentation
**Last Updated**: February 2026

---

## 🚀 QUICK START

### First Time Setup
```
1. Read /CLAUDE.md (project overview)
2. Read backend/PROMPT.md (AI rules)
3. Read backend/TODO.md (current state)
4. Backend: Read backend/ARCHITECTURE.md (patterns)
5. Frontend: Read frontend/NEXTJS_GUIDELINES.md + frontend/CLAUDE.md
```

### Before Every Task
```
Backend:  ARCHITECTURE.md → TODO.md → Start coding
Frontend: NEXTJS_GUIDELINES.md → frontend/CLAUDE.md → TODO.md → Start
```

---

## 📋 CRITICAL FILES (Read First)

| File | Priority | Read When | Purpose |
|------|----------|-----------|---------|
| **PROMPT.md** | 🔴 CRITICAL | Session start | AI operational rules, decision trees |
| **ARCHITECTURE.md** | 🔴 CRITICAL | Before backend coding | Query/Action pattern, Services, DTOs |
| **TODO.md** | 🔴 CRITICAL | Always | Current project state |
| **DGGM_GUIDELINES.md** | 🟠 HIGH | Before backend coding | Project-specific conventions |
| **frontend/NEXTJS_GUIDELINES.md** | 🔴 CRITICAL | Before frontend coding | Next.js 16 breaking changes |
| **frontend/CLAUDE.md** | 🔴 CRITICAL | Before frontend coding | Frontend conventions |

---

## 📁 Complete File Inventory

### Root (`/`)
- **CLAUDE.md** 🟠 HIGH - Project overview, tech stack, modules

### Backend (`/backend/.ai/guidelines/`)

#### Architecture
- **ARCHITECTURE.md** 🔴 CRITICAL - Unified architecture guide (Query/Action/Service)
- **DGGM_GUIDELINES.md** 🟠 HIGH - Project-specific Laravel conventions
- **FINAL_ARCHITECTURE.md** 🟢 DEPRECATED - Content merged into ARCHITECTURE.md
- **AI_ARCHITECTURE_RULES.md** 🟢 DEPRECATED - Content merged into ARCHITECTURE.md

#### Operational
- **PROMPT.md** 🔴 CRITICAL - AI system prompt, decision trees, checklists
- **TODO.md** 🔴 CRITICAL - Implementation status, what's done/missing
- **GUIDELINES_INDEX.md** 🟡 MEDIUM - This file (navigation)

### Frontend (`/frontend/docs/`)
- **NEXTJS_GUIDELINES.md** 🔴 CRITICAL - Next.js 16 breaking changes, patterns
- **CLAUDE.md** 🔴 CRITICAL - Frontend conventions, dark mode, state management

---

## 🎯 Read Flow by Task Type

### Backend Module Creation
```
1. ARCHITECTURE.md      (patterns)
2. DGGM_GUIDELINES.md   (conventions)
3. Similar existing module (Warehouse/Product)
4. Start coding
5. Update TODO.md when done
```

### Frontend Page Creation
```
1. NEXTJS_GUIDELINES.md  (Next.js 16)
2. frontend/CLAUDE.md    (conventions)
3. Similar existing page (Customers/Products)
4. Start coding
5. Update TODO.md when done
```

### Troubleshooting
```
1. Check TODO.md (is it actually implemented?)
2. Read ARCHITECTURE.md (following patterns?)
3. Check NEXTJS_GUIDELINES.md (async params?)
4. Run formatters (pint/lint:fix)
```

---

## 🤖 AI Agent Instructions

### Session Start
```bash
1. Read PROMPT.md
2. Read TODO.md
3. Identify task
```

### Before Backend Coding
```bash
1. Read ARCHITECTURE.md (MANDATORY)
2. Check existing implementation (Warehouse/Product)
3. Follow patterns:
   - Actions in app/Actions/{Domain}/
   - Queries in app/Queries/{Domain}/
   - Services in app/Services/ (NO database)
   - Spatie Data for input + output
```

### Before Frontend Coding
```bash
1. Read NEXTJS_GUIDELINES.md (MANDATORY - async params!)
2. Read frontend/CLAUDE.md (MANDATORY - dark mode!)
3. Server Components by default
4. 'use client' only at leaf
```

### After Coding
```bash
# Backend
./vendor/bin/pint
php artisan typescript:transform

# Frontend
npm run lint:fix

# Both
Update TODO.md
```

---

## ❓ Quick Help

| Question | Answer |
|----------|--------|
| **Architecture rules?** | `ARCHITECTURE.md` |
| **Next.js 16 changes?** | `frontend/NEXTJS_GUIDELINES.md` |
| **Current tasks?** | `TODO.md` |
| **What to do now?** | `PROMPT.md` |
| **Project overview?** | `/CLAUDE.md` |
| **Dark mode rules?** | `frontend/CLAUDE.md` |

---

## 📝 Deprecated Files (Content Merged)

- ~~AI_ARCHITECTURE_RULES.md~~ → Merged into **ARCHITECTURE.md**
- ~~FINAL_ARCHITECTURE.md~~ → Merged into **ARCHITECTURE.md**

**Note**: Old files still exist but use **ARCHITECTURE.md** for unified reference.

---

**Version**: 2.0 (Simplified)
**Last Updated**: February 2026