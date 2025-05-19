# Networking Automation Service

This service provides automated networking capabilities with both frontend and backend components. Follow this guide to set up the service on your own machine.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Google Cloud Platform account (for OAuth)
- OpenAI API key

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/NikhilGoli45/networking-automated
cd networking-automated
```

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory by copying `.env.template`:
```bash
cp .env.template .env
```

4. Configure the following environment variables in `backend/.env`:

#### Required Environment Variables

- `PORT`: The port number for the backend server
  - Default: 3000
  - Choose any available port on your system
    - Note: This port needs to be different than the port of your Frontend and Redirect URI of your Google Oauth


- `OPENAI_API_KEY`: Your OpenAI API key
  - Go to [OpenAI Platform](https://platform.openai.com)
  - Sign up or log in to your account
  - Navigate to API Keys section
  - Click "Create new secret key"
  - Copy the generated key
  - Example: `OPENAI_API_KEY=sk-...`
  - You will need to load your account with credits, $5 should be enough for a year

- `SENDER_EMAIL`: Email address for sending notifications
  - Use a valid email address that will be used to send notifications
  - Example: `SENDER_EMAIL=notifications@yourdomain.com`

- `DATABASE_URL`: Supabase PostgreSQL connection string
  - Go to [Supabase](https://supabase.com) and create an account
  - Create a new project
  - Once your project is created, go to Project Settings > Database
  - Find the "Connection string" section
  - Select "URI" format
  - Copy the Direct Connection String
  - Replace `[YOUR-PASSWORD]` with your database password
  - The connection string will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`
  - Example: `DATABASE_URL=postgresql://postgres:your-password@db.abcdefghijklm.supabase.co:5432/postgres`
  - Note: Keep your database password secure and never commit it to version control

  #### Verifying Database Connection
  - Test the connection using psql or a database client:
    ```bash
    psql "postgresql://postgres:your-password@db.abcdefghijklm.supabase.co:5432/postgres"
    ```
  - If the direct connection fails, use the Session Pooler connection instead:
    1. Go back to Project Settings > Database
    2. Find the "Connection string" section
    3. Select "URI" format
    4. Copy the Session Pooler connection string
    5. The connection string will look like: `postgresql://postgres:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
    6. Example: `DATABASE_URL=postgresql://postgres:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  - Test the session pooler connection:
    ```bash
    psql "postgresql://postgres:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    ```

- `AUTH_USERNAME`: Admin username for basic authentication
  - Choose a secure username for admin access
  - Example: `AUTH_USERNAME=admin`

- `AUTH_PASSWORD_HASH`: Hashed password for admin authentication
  - Choose any password you like
  - Use the provided `hash-password.js` script in the backend directory
  - Run: `node hash-password.js your_password`
  - Copy the generated hash
  - Example: `AUTH_PASSWORD_HASH=$2b$10$...`

- `JWT_SECRET`: A secure random string for JWT token generation
  - Generate a secure random string (at least 32 characters)
  - You can use this command: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Example: `JWT_SECRET=your_generated_secret_here`

#### Google OAuth Variables

- `GOOGLE_CLIENT_ID`: OAuth 2.0 Client ID
  - Go to [Google Cloud Console](https://console.cloud.google.com)
  - Create a new project or select existing one
  - Navigate to "APIs & Services" > "Credentials"
  - Click "Create Credentials" > "OAuth client ID"
  - Select "Web application"
  - Add authorized JavaScript origins (e.g., `http://localhost:5174`)
  - Add authorized redirect URIs: Use the exact URI from your `.env.template` file (`http://localhost:3001/oauth2callback`)
    - Note: This redirect URI is only needed for initial token generation. You can do this locally before deploying to production.
    - If you choose to use a different redirect URI, make sure its port number is different from your frontend port (5174) and backend port (3000)
  - Copy the generated Client ID
  - Example: `GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com`

- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 Client Secret
  - Generated along with the Client ID in Google Cloud Console
  - Copy from the same OAuth 2.0 Client ID creation page
  - Example: `GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here`

- `GOOGLE_REDIRECT_URI`: OAuth redirect URI
  - Must match one of the authorized redirect URIs in Google Cloud Console
  - Default: `http://localhost:3001/oauth2callback`
  - Note: This is only used for initial token generation. After getting the token, you can deploy to production without changing this.

- `GOOGLE_OAUTH_TOKEN_BASE64`: Base64 encoded OAuth token
  - After setting up Google OAuth, run the authentication script:
    ```bash
    cd backend
    node src/gmail-setup.js
    ```
  - This will open your browser for Google OAuth authentication
  - After authenticating, the token will be saved in `token.json`
  - Convert the token to base64:
    ```bash
    base64 token.json > token.base64
    ```
  - Copy the contents of `token.base64` to this variable
  - Example: `GOOGLE_OAUTH_TOKEN_BASE64=eyJ...`
  - Note: This token is long-lived and only needs to be generated once. After getting it, you can deploy to production.

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory by copying `.env.template`:
```bash
cp .env.template .env
```

4. Configure the following environment variable in `frontend/.env`:
- `NEXT_PUBLIC_API_URL`: URL of your backend server

### 6. Starting the Service

1. Start the backend server:
```bash
cd backend
npm start
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:5174 and the backend at http://localhost:3000.

## Deployment

### 1. Backend Deployment on Render

1. Commit your changes to GitHub:
   ```bash
   git add .
   git commit -m "Update environment variables for production"
   git push
   ```

2. Go to [Render](https://render.com) and create an account
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - Name: `networking-automated-backend` (or your preferred name)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free (or your preferred plan)

6. Add the following environment variables in Render's dashboard:
   - Copy all variables from your local `backend/.env` file

7. Click "Create Web Service"
8. Wait for the deployment to complete
9. Copy the provided URL (e.g., `https://your-backend.onrender.com`)

### 2. Frontend Deployment

1. Update your frontend environment:
   ```bash
   cd frontend
   ```

2. Edit `frontend/.env`:
   - Set `NEXT_PUBLIC_API_URL` to your Render backend URL
   - Example: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

3. Commit your changes to GitHub:
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push
   ```

4. Build the frontend:
   ```bash
   npm run build
   ```

5. The build output will be in the `out` directory

6. Deploy to Render (Recommended):
   - Go to [Render](https://render.com)
   - Click "New +" and select "Static Site"
   - Connect your GitHub repository
   - Configure the site:
     - Name: `networking-automated-frontend` (or your preferred name)
     - Build Command: `npm install && npm run build`
     - Publish Directory: `out`
   - Click "Create Static Site"
   - Wait for the deployment to complete

   Alternatively, you can deploy the contents of the `out` directory to any static hosting service:
   - [Vercel](https://vercel.com)
   - [Netlify](https://netlify.com)
   - [GitHub Pages](https://pages.github.com)
   - Or any other static hosting service

## Testing

After deployment, test the email functionality:
1. Log in to the application
2. Add your own email address as a contact, preferrably different than the one you are sending emails from as it might mess up the reply detection
3. Send a test email to yourself by running the scheduler
4. Verify that you receive the email
  - Note: The system only sends emails on Mon, Tue, and Wed so don't worry if you didn't get an email and its not one of those days
5. Check that the email content and formatting are correct

This will help ensure that:
- The OAuth token is working correctly
- Email sending functionality is properly configured
- The application is ready for use with other contacts

## Security Notes

- Never commit `.env` files to version control
- Keep your API keys and secrets secure
- Regularly rotate your JWT secret and OAuth tokens
- Use strong passwords for database access

## Troubleshooting

If you encounter any issues:
1. Ensure all environment variables are properly set
2. Check that the database is running and accessible
3. Verify that the Google OAuth credentials are correctly configured
4. Check the console logs for both frontend and backend for error messages

## Support

For additional support or questions, please [open an issue](<repository-issues-url>). 