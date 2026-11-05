# StudioSpace - Backend REST API

> **Live API Base URL:** [https://studiospace-server-c4j2.onrender.com/api](https://studiospace-server-c4j2.onrender.com/api)  
> **Live Frontend Application:** [https://studiospacelive.netlify.app](https://studiospacelive.netlify.app)  
> **Examiner Test Credentials:** `examiner@studiospace.io` / `Test1234`  
> **Client Repository:** [https://github.com/choyon-dev/studiospace-client](https://github.com/choyon-dev/studiospace-client)  
> **Server Repository:** [https://github.com/choyon-dev/studiospace-server](https://github.com/choyon-dev/studiospace-server)

High-performance Express.js backend for the StudioSpace creative marketplace, featuring MongoDB Atlas integration, cryptographic JWT sessions delivered over secure cross-origin HTTPOnly cookies, and strict double-booking collision prevention.

---

## Architecture & Engineering Highlights

- **Double-Booking Collision Prevention (Assignment Challenge 2):** High-precision date and time-slot overlap queries run prior to inserting any reservation. Bookings on the same date with intersecting hours (`startTime < existingEnd && endTime > existingStart`) are atomically rejected.
- **Cross-Origin HTTPOnly Cookie Security (Assignment Challenge 1):** Authentication cookies are signed with JWT and configured with `httpOnly: true`, `secure: true`, and `sameSite: 'none'` to enable secure credential exchange between the Netlify frontend and Render API domains.
- **Dynamic Aggregation Pipeline:** Aggregates real-time marketplace metrics across categories, hubs, and price distributions via `/api/studios/meta` to power instant frontend search and navigation facets.
- **Database Resilience:** MongoDB connection caching with auto-reconnection and unified error handling middleware across all route handlers.

---

## Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/studiospace?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_change_in_production_123456
CLIENT_URL=https://studiospacelive.netlify.app
NODE_ENV=production
```

For local client development, set `CLIENT_URL=http://localhost:3000` and `NODE_ENV=development`.

---

## API Endpoints Specification

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/jwt` | Public | Signs and sets cross-origin HTTPOnly JWT session cookie |
| `POST` | `/api/auth/logout` | Public | Clears session cookie |
| `GET` | `/api/auth/me` | Protected (JWT) | Validates cookie token and returns authenticated user payload |

### 2. Studio Workspaces (`/api/studios`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/studios` | Public | List studios with search, category, hub, price, and sort filters |
| `GET` | `/api/studios/featured` | Public | Returns top 6 verified spaces sorted by rating |
| `GET` | `/api/studios/meta` | Public | Aggregates dynamic categories, location hubs, and price bounds |
| `GET` | `/api/studios/categories` | Public | Returns distinct categories with sample preview imagery |
| `GET` | `/api/studios/my` | Protected (JWT) | Returns listings owned by authenticated host |
| `GET` | `/api/studios/:id` | Public | Returns single studio details by MongoDB ObjectId or slug |
| `POST` | `/api/studios` | Protected (JWT) | Creates new studio listing |
| `PATCH` | `/api/studios/:id` | Protected (Owner only) | Updates listing details, rates, equipment, or availability |
| `DELETE` | `/api/studios/:id` | Protected (Owner only) | Deletes studio listing |

### 3. Bookings & Availability (`/api/bookings`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/bookings` | Protected (JWT) | Reserves time slot with collision overlap check |
| `GET` | `/api/bookings/my` | Protected (JWT) | Returns user-created reservations |
| `GET` | `/api/bookings/incoming` | Protected (Host only) | Returns incoming booking requests for host listings |
| `GET` | `/api/bookings/studio/:studioId` | Public | Returns active booked time slots for calendar blocking |
| `PATCH` | `/api/bookings/:id/cancel` | Protected (Booker only) | Cancels pending or confirmed reservation |
| `PATCH` | `/api/bookings/:id/approve` | Protected (Host only) | Approves pending booking request |
| `PATCH` | `/api/bookings/:id/decline` | Protected (Host only) | Declines booking request |

### 4. Wishlist & Saved Studios (`/api/wishlist`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/wishlist/my` | Protected (JWT) | Returns saved studios array and IDs for authenticated user |
| `POST` | `/api/wishlist/toggle` | Protected (JWT) | Toggles studio save status (add / remove) |
| `GET` | `/api/wishlist/check/:studioId` | Protected (JWT) | Checks if specific studio is in user wishlist |

### 5. Reviews & Ratings (`/api/reviews`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/reviews/studio/:studioId` | Public | Lists verified reviews for a studio |
| `GET` | `/api/reviews/check/:bookingId` | Protected (JWT) | Verifies review eligibility for completed booking |
| `POST` | `/api/reviews` | Protected (JWT) | Submits review and recalculates studio average rating |

---

## Data Models Overview

- **Studio (`models/Studio.js`):** Title, slug, description, category, hourlyRate, securityDeposit, address, city, state, country, squareFeet, STC sound rating, electrical power specs, amenities, equipment list, images array, host metadata, rating, reviewCount.
- **Booking (`models/Booking.js`):** studioId, userId, userEmail, userName, date, startTime, endTime, totalHours, subtotal, deposit, totalAmount, status (`confirmed`, `cancelled`, `pending`), specialRequests, invoiceId.
- **User (`models/User.js`):** Name, email, photoURL, role (`creator`, `host`, `admin`), wishlist array of studio ObjectIds.
- **Review (`models/Review.js`):** studioId, bookingId, userId, userName, userAvatar, rating (1-5), comment, createdAt.

---

## Database Seeding

To seed verified sample production studios into MongoDB Atlas:

```bash
npm run seed
```

---

## Production Deployment (Render)

1. Connect the `studiospace-server` repository on Render Web Services.
2. Build command: `npm install`
3. Start command: `node index.js`
4. Set Environment Variables in Render Dashboard:
   - `PORT=5000`
   - `MONGODB_URI=<your_mongodb_atlas_connection_string>`
   - `JWT_SECRET=<strong_cryptographic_secret>`
   - `CLIENT_URL=https://studiospacelive.netlify.app`
   - `NODE_ENV=production`
