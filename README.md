# Internal Service Report Platform

Platform laporan maintenance internal bergaya Google Drive dengan stack React (Vite) + Tailwind CSS untuk frontend dan Golang (Gin) + MySQL untuk backend. Sistem mendukung hierarki role MASTER_ADMIN → ADMIN → TEKNISI, autentikasi JWT via httpOnly cookie, serta manajemen laporan service lengkap.

## Arsitektur & Folder Struktur
```
Web Service Report /
├── backend/                # Gin + GORM + Clean Architecture style
│   ├── cmd/server/main.go  # Entry point
│   ├── internal/
│   │   ├── config/         # Env loader
│   │   ├── database/       # Connection, migrations, seed
│   │   ├── domain/
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   └── report/
│   │   ├── middleware/     # Auth & role guard
│   │   └── server/         # Router + HTTP server
│   └── pkg/                # Shared helpers (bcrypt, jwt, response)
├── frontend/               # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── routes/
│   └── package.json
└── README.md
```

## Database Schema (MySQL)
```sql
CREATE TABLE roles (
  id TINYINT PRIMARY KEY,
  name VARCHAR(32) UNIQUE,
  description VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_id TINYINT NOT NULL,
  parent_id BIGINT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (parent_id) REFERENCES users(id)
);

CREATE TABLE service_reports (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dispatch_no VARCHAR(32) UNIQUE,
  admin_id BIGINT NOT NULL,
  teknisi_id BIGINT NULL,
  customer_name VARCHAR(120),
  customer_address VARCHAR(255),
  customer_contact VARCHAR(120),
  device_name VARCHAR(100),
  serial_number VARCHAR(100),
  device_location VARCHAR(120),
  complaint TEXT,
  action_taken TEXT,
  status ENUM('open','progress','done') DEFAULT 'open',
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  FOREIGN KEY (teknisi_id) REFERENCES users(id)
);

CREATE TABLE report_photos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  report_id BIGINT,
  type ENUM('before','after','other') DEFAULT 'other',
  file_path VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES service_reports(id) ON DELETE CASCADE
);

CREATE TABLE report_status_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  report_id BIGINT,
  changed_by BIGINT,
  from_status VARCHAR(32),
  to_status VARCHAR(32),
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES service_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
```
Seeder pertama membuat akun MASTER_ADMIN default dari variabel lingkungan `SEED_MASTER_EMAIL` dan `SEED_MASTER_PASSWORD`.

## API Endpoint Ringkasan
| Method | Path | Role | Keterangan |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | All | Login, keluarkan JWT cookie |
| POST | `/api/v1/auth/logout` | All | Logout, hapus cookie |
| GET | `/api/v1/auth/me` | Auth | Profil user saat ini |
| POST | `/api/v1/admins` | MASTER_ADMIN | Create admin |
| GET | `/api/v1/admins` | MASTER_ADMIN | List admin |
| PATCH | `/api/v1/admins/:id/reset-password` | MASTER_ADMIN | Reset password admin |
| POST | `/api/v1/teknisi` | ADMIN | Create teknisi |
| GET | `/api/v1/teknisi` | ADMIN | List teknisi |
| PATCH | `/api/v1/teknisi/:id/reset-password` | ADMIN | Reset password |
| POST | `/api/v1/reports` | ADMIN | Buat laporan service |
| GET | `/api/v1/reports` | ADMIN/MASTER | Daftar seluruh laporan |
| PATCH | `/api/v1/reports/:id/assign` | ADMIN | Assign teknisi |
| GET | `/api/v1/reports/assigned` | TEKNISI | Daftar laporan penugasan |
| PATCH | `/api/v1/reports/:id/progress` | TEKNISI | Update hasil pekerjaan |
| POST | `/api/v1/reports/:id/photos` | TEKNISI | Upload foto before/after |
| PATCH | `/api/v1/reports/:id/complete` | TEKNISI | Tandai selesai |
| GET | `/api/v1/history` | ADMIN/MASTER | Laporan selesai |

Semua respons berformat `{ "data": ..., "meta": ..., "errors": ... }`.

## Backend (Gin) – Menjalankan di Lokal dengan XAMPP
1. Start Apache & MySQL melalui XAMPP.
2. Buat database `service_reports` dan jalankan schema SQL di atas (mis. `mysql -u root < schema.sql`).
3. Salin `.env.example` → `.env` kemudian isi kredensial:
   ```env
   APP_NAME=Service Report
   SERVER_PORT=8080
   DB_DSN=root:@tcp(127.0.0.1:3306)/service_reports?parseTime=true&loc=Local
   JWT_SECRET=super-secret
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=24h
   UPLOAD_DIR=./uploads
   FRONTEND_URL=http://localhost:5173
   SEED_MASTER_EMAIL=master@corp.com
   SEED_MASTER_PASSWORD=ChangeMe123!

   # Gmail SMTP (dev only — ganti ke Hostinger nanti)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-gmail-address@gmail.com
   SMTP_PASSWORD=your-gmail-app-password
   SMTP_FROM="Service Report <your-gmail-address@gmail.com>"
   ```
   Untuk Gmail wajib membuat **App Password** (https://myaccount.google.com/apppasswords) lalu gunakan nilai tersebut sebagai `SMTP_PASSWORD`.
4. Jalankan backend:
   ```bash
   cd backend
   go mod tidy
   go run ./cmd/server
   ```
   Server tersedia di `http://localhost:8080/api/v1`.

## Frontend (React + Vite + Tailwind)
1. Install dependensi:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Frontend otomatis memakai Axios dengan `withCredentials` menuju `http://localhost:8080/api/v1`.
3. Layout dashboard mengikuti wireframe (sidebar collapsible, top search bar, card status, tabel), dilengkapi form admin dan teknisi.

## Cara Integrasi Foto Upload
- Endpoint `/reports/:id/photos` menerima `multipart/form-data`. Backend menyimpan file ke `UPLOAD_DIR` dengan nama unik.
- Frontend teknisi menyediakan field multiple file.

## Security Best Practices
1. **Role-based access di backend** – middleware auth & role guard wajib dipasang di seluruh route sensitif.
2. **JWT in httpOnly cookie** – mencegah XSS mencuri token. Gunakan `SameSite=Lax` untuk akses dari domain yang sama.
3. **Password hashing** – bcrypt cost 12+. Tidak pernah menyimpan plaintext.
4. **Input validation** – Gin binding + validator, limit ukuran file upload, sanitize teks sebelum render.
5. **Audit trail** – `report_status_logs` menyimpan histori status, memudahkan review manipulasi.
6. **Secure defaults** – `.env` tidak dibagikan, gunakan secrets manager di production, enforce HTTPS & Secure cookie.
7. **DB principle of least privilege** – buat user MySQL khusus dengan hak minimal untuk aplikasi.

## Testing Checklist
- ✅ Login/logout untuk masing-masing role
- ✅ MASTER_ADMIN membuat admin baru
- ✅ ADMIN membuat teknisi & laporan service
- ✅ TEKNISI mengupdate status & upload foto
- ✅ Protected route di frontend sesuai role

Siap dikembangkan lebih lanjut (notifikasi, integrasi mapas, dsb). Seluruh kode contoh ada pada folder backend/frontend di repo ini.
