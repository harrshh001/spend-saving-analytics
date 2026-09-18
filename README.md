# Spend & Saving Analytics Platform 📊

An enterprise-grade internal platform designed to give procurement teams, finance leaders, and department heads real-time visibility into organizational spend, budget variances, and cost-saving opportunities.

---

## 🌟 Features Overview

### 1. Executive Analytics Dashboard
- **6 Real-time KPI Cards**:
  - **Total Budget**: Organization-wide allocated budget.
  - **Actual Spend**: Aggregated actual expenditures.
  - **Total Savings**: Dynamically computed savings (`Budget - Actual Spend`) with positive/negative color variance.
  - **Savings Rate (%)**: Percentage of budget saved vs allocated.
  - **Over-Budget Count**: Alert count of departments or categories exceeding allocated limits.
  - **Average Transaction**: Average spend per record.
- **5 Comprehensive Chart Visualizations**:
  - 📈 **Spend vs Budget Trend**: Multi-line chart showing monthly budget vs actual expenditure.
  - 📊 **Category Breakdown**: Ranked horizontal bar chart highlighting top spend categories.
  - 🍩 **Business Unit Distribution**: High-contrast donut chart depicting allocation across business divisions.
  - 📊 **Monthly Spend vs Budget**: Grouped/stacked bar chart illustrating variance month by month.
  - 🌊 **Cumulative Spend Growth**: Gradient area chart visualizing fiscal accumulation over time.
- **Data-Driven Automated Insights**:
  - Live natural-language insight cards generated dynamically from filtered metrics (top category, most efficient business unit, highest spending location, over-budget anomalies).

### 2. Powerful Spend Records Table
- Built with **@tanstack/react-table v8** and **@dnd-kit**:
  - 🔍 **Debounced Global Search**: Fast filter across all vendor, category, department, location, and status fields.
  - 🔄 **Column Reordering**: Drag-and-drop table headers to customize the grid layout with `@dnd-kit`.
  - 📐 **Column Resizing**: Interactive drag handles on every column boundary.
  - 📌 **Column Pinning**: Pin crucial columns (e.g. ID, Date, Actions) to the left or right during horizontal scrolling.
  - 👁️ **Column Visibility**: Dropdown menu to show/hide any column on demand.
  - ✏️ **Inline Cell Editing**: Double-click budget, spend, or category cells to edit values with instant backend persistence and automatic dashboard KPI recalculation.
  - 📄 **Customizable Pagination**: Jump between pages and switch page sizes (10, 20, 50, 100 rows).
  - 📥 **CSV Export**: Instant export of currently filtered data to downloadable `.csv`.
  - 🗑️ **Delete Record**: Safe record deletion with styled confirmation modal.

### 3. Add & Edit Record Modal
- Validated with **React Hook Form + Zod**:
  - Fast keyboard shortcuts (Escape to close, Enter to submit).
  - Typeahead dropdowns for Category, Vendor, Department, Business Unit, and Location.
  - Integrated **Date Picker**.
  - **Live Savings Preview**: Instantly calculates and previews the resulting savings and savings % before submitting.

### 4. Global Multi-Filter Bar
- Multi-select dropdown filters for:
  - **Business Unit**
  - **Category**
  - **Vendor**
  - **Location**
  - **Status** (Approved, Over Budget)
- **Date Range Picker** (From / To).
- **One-click Clear Filters** reset.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Core**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS v4, Inter & JetBrains Mono typography, custom glassmorphism design system
- **Routing**: React Router v6 (`react-router-dom`)
- **State & Caching**: `@tanstack/react-query`
- **Data Grid**: `@tanstack/react-table v8`, `@dnd-kit/core`, `@dnd-kit/sortable`
- **Visualizations**: `recharts`
- **Forms & Validation**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **Date Picking**: `react-datepicker`, `date-fns`
- **Icons & Feedback**: `lucide-react`, `react-hot-toast`

### Backend (`/server`)
- **Runtime & Framework**: Node.js, Express, TypeScript, `tsx`
- **Database ORM**: Prisma 6 with **SQLite** (`file:./dev.db`) for zero-config, portable evaluation (PostgreSQL compatible schema)
- **Security & Auth**: JSON Web Tokens (JWT), `bcryptjs`, `helmet`, `cors`
- **Data Ingestion**: Support for Excel `.xlsx` parsing and fallback CSV dataset

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### 1. Backend Setup & Run

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Push Prisma schema and seed initial records
npx prisma db push
npm run seed

# Start development server
npm run dev
```
The server will start on **`http://localhost:4000`**.

### 2. Frontend Setup & Run

Open a new terminal:
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install --legacy-peer-deps

# Start Vite dev server
npm run dev
```
The client will be running on **`http://localhost:5173`**.

---

## 🔑 Demo Credentials

A test user account is pre-seeded in the database:
- **Email**: `intern@spendtracker.com`
- **Password**: `Test@1234`

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` — Authenticate user and receive JWT token
- `POST /api/auth/register` — Register a new account
- `GET /api/auth/me` — Verify current session and retrieve profile

### Spend Analytics
- `GET /api/spend` — Paginated, sorted, and filtered spend records
- `GET /api/spend/summary` — Aggregated KPI metrics and chart datasets
- `GET /api/spend/filter-options` — Distinct values for filter dropdowns
- `GET /api/spend/:id` — Retrieve a single record
- `POST /api/spend` — Create a new spend record
- `PATCH /api/spend/:id` — Update fields of an existing record (supports inline edits)
- `DELETE /api/spend/:id` — Remove a record

---

## 🗄️ Database Architecture

### `User`
| Field | Type | Attributes |
|---|---|---|
| `id` | String | `@id @default(cuid())` |
| `name` | String | |
| `email` | String | `@unique` |
| `password` | String | Hashed with bcrypt (cost: 12) |
| `createdAt` | DateTime | `@default(now())` |

### `SpendRecord`
| Field | Type | Description |
|---|---|---|
| `id` | Int | `@id @default(autoincrement())` |
| `date` | DateTime | Date of transaction |
| `department` | String | Department (IT, HR, Marketing, etc.) |
| `category` | String | Spend category (Cloud, Licenses, Hardware, etc.) |
| `vendor` | String | Vendor name |
| `location` | String | Office / Branch location |
| `businessUnit` | String | Business division |
| `budget` | Float | Allocated budget (INR) |
| `actualSpend` | Float | Actual incurred expenditure (INR) |
| `status` | String | 'Approved' \| 'Over Budget' |
| `priority` | String | 'High' \| 'Medium' \| 'Low' |
| `paymentMethod`| String | Payment type |

*Note: Savings (`budget - actualSpend`) and Savings Rate (`savings / budget * 100`) are computed dynamically on-the-fly and never persisted in raw form, ensuring mathematical consistency.*
