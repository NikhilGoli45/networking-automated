const bcrypt = require("bcrypt");
const crypto = require("crypto");

const password = "myStrongSecretPassword"; // <- Replace with your chosen password

async function generate() {
  const hashedPassword = await bcrypt.hash(password, 10);
  const jwtSecret = crypto.randomBytes(64).toString("hex");

  console.log("Add the following to your .env file:");
  console.log(`AUTH_PASSWORD_HASH=${hashedPassword}`);
  console.log(`JWT_SECRET=${jwtSecret}`);
}

generate();
