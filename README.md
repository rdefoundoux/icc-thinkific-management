# Thinkific Manager

**Description:**  
`thinkific-manager` is a project designed to manage Thinkific integrations. It consists of:
- `pcnc-server`: A Node.js backend to handle OAuth integrations, API calls, and user authentication.
- `pcnc-app`: A React frontend for user interaction.

---

## Folder Structure

---

## Getting Started

### 1. Backend (`pcnc-server`)
#### Setup:
1. Navigate to the `pcnc-server` folder:
   ```bash
   cd pcnc-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add environment variables in `.env`:
   ```
   THINKIFIC_CLIENT_ID=***
   THINKIFIC_CLIENT_SECRET=***
   THINKIFIC_SUBDOMAIN=your-subdomain
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

---

### 2. Frontend (`pcnc-app`)
#### Setup:
1. Navigate to the `pcnc-app` folder:
   ```bash
   cd pcnc-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npm start
   ```

---

## Environment Variables

#### Backend `.env`
#### Frontend `.env`

---

## License
MIT License
