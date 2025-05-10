const { authorize } = require("./services/auth");

authorize().then(() => {
  console.log("OAuth completed!");
});
