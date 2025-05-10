const fs = require("fs");
const http = require("http");
const url = require("url");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = "token.json";
const CREDENTIALS_PATH = "src/client_secret.json";

function loadCredentials() {
  const content = fs.readFileSync(CREDENTIALS_PATH);
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

function startServerForCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const query = url.parse(req.url, true).query;
      if (query.code) {
        res.end("Auth complete! You can close this tab.");
        server.close();
        resolve(query.code);
      } else {
        res.end("No code received.");
        reject("No code received.");
      }
    });
    server.listen(3000, () => {
      console.log("Listening on http://localhost:3000 for the OAuth redirect...");
    });
  });
}

async function authorize() {
  const oAuth2Client = loadCredentials();

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Visit this URL in your browser:\n", authUrl);
  const code = await startServerForCode();
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log("Token saved to", TOKEN_PATH);

  return oAuth2Client;
}

module.exports = { authorize };
