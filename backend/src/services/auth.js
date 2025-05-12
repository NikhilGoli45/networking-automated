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
  const content = fs.readFileSync(CREDENTIALS_PATH);
  const credentials = JSON.parse(content);
  const { client_id, client_secret, redirect_uris } = credentials.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
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

  // Check for cached token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    console.log("Loaded existing token from file.");
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Token not found, start auth flow
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Visit this URL in your browser:\n", authUrl);

  const code = await startServerForCode();
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Save token to disk
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log("Token saved to", TOKEN_PATH);

  return oAuth2Client;
}

module.exports = { authorize };
