const express = require("express");
const apierror = require("./util/global-error");
const compression = require("compression");
const ratelimiter = require("express-rate-limit");
const mongosanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const path = require("path");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");
const cookie_parser = require("cookie-parser");
const error = require("./controllers/error");
const user_route = require("./router/User");
const question_route = require("./router/Question");
const u_q_route = require("./router/U_Q");
/////////////////////
const limiter = ratelimiter({
  max: 100000,
  windowMs: 60 * 60 * 1000,
  message: "too many request",
});
///////////////////
const app = express();
app.use(compression());
app.use(cors());
app.use(cookie_parser());
app.use(express.json({ limit: "50kb" }));
app.use(
  "/public/images",
  express.static(path.join(__dirname, "/public/images"))
);
app.use(mongosanitize());
app.use(xss());
app.use(helmet());
app.use(
  hpp({
    // whitelist: ['name', 'email', 'post'],
  })
);
///////////////////////////////
app.use("/user", user_route);
app.use("/question", question_route);
app.use("/uq", u_q_route);
/////////////////////
app.all("*", (req, res, next) => {
  console.log(req.url);
  return next(new apierror("invalid api request", 400));
});
app.use(error);
module.exports = app;
