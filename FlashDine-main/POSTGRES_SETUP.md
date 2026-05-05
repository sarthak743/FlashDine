# Quick PostgreSQL Setup for Windows

## Option A: Using Windows Installer (Recommended)

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. **Important**: When prompted for a password, use a simple one like `postgres123` (or remember what you set)
4. Keep all default settings:
   - Port: `5432`
   - Locale: Default
5. Complete the installation

## Option B: Using Chocolatey (if installed)

```powershell
choco install postgresql
```

## Option C: Using Windows Subsystem for Linux (WSL)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

---

## After Installation

### Step 1: Connect to PostgreSQL

**On Windows (using Command Prompt)**:
```cmd
psql -U postgres
```

When prompted for password, enter the password you set during installation (default is often `postgres` or `postgres123`)

### Step 2: Update Your .env File

Once connected, update your `server/.env`:

```env
PG_USER=postgres
PG_PASSWORD=postgres123
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=flashdine
SESSION_SECRET=flashdine_session_development_secret_key_change_me
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Replace `postgres123` with the actual password you set.

### Step 3: Create Database

```cmd
psql -U postgres -c "CREATE DATABASE flashdine;"
```

### Step 4: Setup Demo Admin Accounts

```cmd
psql -U postgres -d flashdine -f server/setup_demo_admins.sql
```

### Step 5: Verify Connection

```cmd
psql -U postgres -d flashdine -c "SELECT * FROM admins LIMIT 5;"
```

---

## Troubleshooting

### "psql: command not found"
- PostgreSQL is not in your system PATH
- Add `C:\Program Files\PostgreSQL\15\bin` to your Windows PATH environment variable
- Restart your terminal

### "password authentication failed"
- Check your password in setup_demo_admins.sql matches the .env
- Verify you typed the correct password during PostgreSQL installation
- Try resetting PostgreSQL password (search: "PostgreSQL reset password Windows")

### "database flashdine does not exist"
- Run: `psql -U postgres -c "CREATE DATABASE flashdine;"`
- Then run setup_demo_admins.sql

---

## Demo Admin Credentials

After running `setup_demo_admins.sql`, you can login with:

- **Email**: `admin@campus-delights.com`
- **Password**: `admin123`
- **Restaurant**: Campus Delights

Other demo accounts:
- `admin@spice-house.com` (Spice House)
- `admin@pizza-palace.com` (Pizza Palace)
- `admin@fusion-hub.com` (Fusion Hub)

---

## Starting The Application

Once PostgreSQL is set up and running:

```bash
# Terminal 1: Start Backend
cd server
npm run dev

# Terminal 2: Start Frontend
npm run dev
```

Visit: http://localhost:5173
