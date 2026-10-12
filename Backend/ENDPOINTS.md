# API Endpoints

Base URL (local): `http://localhost:3000`

## 1) Health Check

- **Method:** `GET`
- **Path:** `/health`
- **Description:** Check server status.

### Success Response (200)

```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2026-03-09T10:00:00.000Z",
  "uptime": 123.45
}
```

---

## 2) Admin Login

- **Method:** `POST`
- **Path:** `/api/admin/login`
- **Description:** Login as admin.

### Request Body

```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt_token>",
  "data": {
    "id": "<admin_id>",
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

### Error Responses

- `400`: Username and password are required
- `401`: Invalid username or password
- `500`: Server error

---

## 3) Admin Register

- **Method:** `POST`
- **Path:** `/api/admin/register`
- **Description:** Create a new admin account. **Requires an admin token** (`Authorization: Bearer <token>`).

### Request Body

```json
{
  "username": "admin2",
  "email": "admin2@example.com",
  "password": "StrongPass@123"
}
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "id": "<admin_id>",
    "username": "admin2",
    "email": "admin2@example.com"
  }
}
```

### Error Responses

- `400`: Missing fields / weak password / invalid username
- `409`: Username or email already exists
- `429`: Too many requests
- `500`: Server error

---

## 4) Add Blog

- **Method:** `POST`
- **Path:** `/api/blog/add`
- **Description:** Create a new blog post.

### Headers

- `Authorization: Bearer <jwt_token>`

### Request Body

```json
{
  "title": "My First Blog",
  "content": "This is blog content.",
  "author": "Rahul",
  "category": "General",
  "tags": ["tech", "news"],
  "image": "https://example.com/image.jpg",
  "status": "draft"
}
```

### Required Fields

- `title`
- `content`
- `author`

### Success Response (201)

```json
{
  "success": true,
  "message": "Blog added successfully",
  "data": {
    "_id": "<blog_id>",
    "title": "My First Blog"
  }
}
```

### Error Responses

- `400`: Title, content, and author are required
- `401`: Unauthorized / invalid token
- `500`: Failed to add blog

---

## 5) Get All Blogs

- **Method:** `GET`
- **Path:** `/api/blog/all`
- **Description:** Fetch all blogs sorted by latest first.

### Success Response (200)

```json
{
  "success": true,
  "count": 1,
  "data": []
}
```

### Error Response

- `500`: Failed to fetch blogs

---

## 6) Finance (admin only)

All routes need `Authorization: Bearer <token>` and live under `/api/finance`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/summary` | Wallet balance, invoiced, received, outstanding, 6-month series |
| GET / POST | `/clients` | List (with billing totals) / create client |
| PUT / DELETE | `/clients/:id` | Update / delete (blocked while the client has invoices) |
| GET / POST | `/invoices` | List (`status`, `client`, `search`) / create |
| GET / PUT / DELETE | `/invoices/:id` | Detail with payments / edit / delete |
| POST | `/invoices/:id/payments` | Record a payment (credits the wallet) |
| GET | `/payments` | Payment history (`client`, `invoice`, `method`, `from`, `to`) |
| DELETE | `/payments/:id` | Remove a payment (recalculates the invoice) |
| GET / POST | `/expenses` | List / create (debits the wallet) |
| PUT / DELETE | `/expenses/:id` | Update / delete (ledger stays in sync) |
| GET / POST | `/wallet` | Ledger with running balance / manual credit or debit |
| DELETE | `/wallet/:id` | Delete a manual entry |

## 7) Email and company settings (admin only)

Outgoing email is configured in the database, not in `.env`. Use the admin
panel (Settings > Email) or these endpoints:

- `GET /api/settings` - company details and the saved SMTP settings (the password is never returned, only `passSet`).
- `PUT /api/settings/company` - save company details.
- `POST /api/settings/company/logo` / `DELETE /api/settings/company/logo` - upload or remove the logo.
- `PUT /api/settings/smtp` - save host, port, secure, user, from and password; the connection is checked straight away.
- `POST /api/settings/smtp/test` with `{ "to": "you@example.com" }` - sends a test email.
- `GET /api/admin/smtp/status` - re-checks the saved SMTP login.

---

## First admin account

On first start with an empty database the API creates one admin from these
environment variables (all three are required in production):

- `DEFAULT_ADMIN_USERNAME`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

There are no built-in credentials. Registering further admins
(`POST /api/admin/register`) requires an existing admin's token.

## Environment

See `.env.example` for every setting. In production (`NODE_ENV=production`)
the server refuses to start without `MONGO_URI` and a `JWT_SECRET` of at least
32 characters, and hides internal error details from API responses.
