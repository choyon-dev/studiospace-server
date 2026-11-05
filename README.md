# StudioSpace — Backend REST API

> **Live API Base URL:** [https://studiospace-server-c4j2.onrender.com/api](https://studiospace-server-c4j2.onrender.com/api)  
> **Live Frontend Application:** [https://studiospacelive.netlify.app](https://studiospacelive.netlify.app)  
> **Examiner Test Credentials:** `examiner@studiospace.io` / `Test1234`

High-performance Express.js backend for StudioSpace marketplace, featuring MongoDB Atlas integration, JWT security over HTTPOnly cookies, and strict double-booking collision prevention.

---

## Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/studiospace?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_change_in_production_123456
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

---

## API Endpoints Specification

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/jwt` | Public | Signs and sets HTTPOnly JWT cookie for user session |
| `POST` | `/api/auth/logout` | Public | Clears session cookie |
| `GET` | `/api/auth/me` | Protected (JWT) | Validates cookie token and returns authenticated user |

### 2. Studio Workspaces (`/api/studios`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/studios/featured` | Public | Returns top 6 featured spaces sorted by rating (`.limit(6)`) |
| `GET` | `/api/studios` | Public | Returns studios with category, search and sorting query parameters |
| `GET` | `/api/studios/:id` | Public | Returns single studio details by ObjectId |
| `GET` | `/api/studios/my` | Protected (JWT) | Returns user-owned listings matching authenticated email |
| `POST` | `/api/studios` | Protected (JWT) | Creates new studio listing |
| `PATCH` | `/api/studios/:id` | Protected (Owner only) | Updates studio listing details |
| `DELETE` | `/api/studios/:id` | Protected (Owner only) | Deletes studio listing |

### 3. Bookings (`/api/bookings`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/bookings` | Protected (JWT) | Creates booking with double-booking collision prevention |
| `GET` | `/api/bookings/my` | Protected (JWT) | Returns all bookings made by the authenticated user |
| `GET` | `/api/bookings/studio/:studioId` | Public | Returns active booked slots for a studio on a given date |
| `PATCH` | `/api/bookings/:id/cancel` | Protected (Booker only) | Cancels pending/confirmed reservation |

---

## Database Seeding

To populate initial verified creative studios:

```bash
npm run seed
```

---

## Deployment (Render)

1. Connect repository on Render Web Services.
2. Build command: `npm install`
3. Start command: `node index.js`
4. Configure environment variables in Render Dashboard (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`).
