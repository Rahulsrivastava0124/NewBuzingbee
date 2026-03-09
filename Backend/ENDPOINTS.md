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
- **Description:** Create new admin account.

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

## Default Admin Account

A default admin is auto-created when DB connects (if not already present):

- `username`: `admin`
- `email`: `admin@example.com`
- `password`: `admin123`

You can override using `.env`:

- `DEFAULT_ADMIN_USERNAME`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `MONGO_URI`
- `JWT_SECRET`
