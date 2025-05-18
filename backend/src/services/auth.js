const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const http = require("http");
const url = require("url");

const CREDENTIALS_PATH = "src/client_secret.json";
const TOKEN_PATH = "token.json";
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly"
];

function loadOAuthClient() {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

  if (!client_id || !client_secret || !redirect_uri) {
    throw new Error("Missing required OAuth environment variables.");
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

  let token;

  if (process.env.GOOGLE_OAUTH_TOKEN_BASE64) {
    const decoded = Buffer.from(process.env.GOOGLE_OAUTH_TOKEN_BASE64, 'base64').toString();
    token = JSON.parse(decoded);
    console.log("Loaded token from environment.");
  } else if (fs.existsSync(TOKEN_PATH)) {
    token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    console.log("Loaded token from file.");
  } else {
    throw new Error("No OAuth token found. Run locally to generate token.");
  }

  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

module.exports = { authorize };
