const { google } = require("googleapis");
const http = require("http");
const url = require("url");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly"
];

function loadOAuthClient() {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

  if (!client_id || !client_secret || !redirect_uri) {
    throw new Error("Missing required Google OAuth environment variables");
  }

  return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
}

function startServerForCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const query = url.parse(req.url, true).query;
      if (query.code) {
        res.end("Authorization successful. You can close this tab.");
        server.close();
        resolve(query.code);
      } else {
        res.end("No code found.");
        reject("No code provided.");
      }
    });
    server.listen(3001, () => {
      console.log("Listening on http://localhost:3001 for the OAuth redirect...");
    });
  });
}

async function authorize() {
  const oAuth2Client = loadOAuthClient();

  // Check for token in environment variable
  const tokenString = process.env.GOOGLE_OAUTH_TOKEN;
  if (tokenString) {
    try {
      const token = JSON.parse(tokenString);
      console.log("Loaded token from environment variable.");
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    } catch (error) {
      console.error("Error parsing token from environment:", error);
    }
  }

  // Token not found or invalid, start auth flow
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Visit this URL in your browser:\n", authUrl);

  const code = await startServerForCode();
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Log the token so it can be added to environment variables
  console.log("New token obtained. Add this to your environment variables as GOOGLE_OAUTH_TOKEN:");
  console.log(JSON.stringify(tokens));

  return oAuth2Client;
}

module.exports = { authorize };
