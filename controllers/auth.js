const catchAsync = require("../util/catch-async");
const User = require("../model/User");
const apierror = require("../util/global-error");
const jwt = require("jsonwebtoken");
const mailer = require("../util/mailer");
const { promisify } = require("util");
exports.signup = catchAsync(async (req, res, next) => {
  if (!req.body.email) return next(new apierror("Email missing", 303));
  if (req.body.active) delete req.body.active;
  if (req.body.role) delete req.body.role;
  await User.deleteOne({ email: req.body.email, active: false });
  let user = await User.create(req.body);
  let token = await user.generatetoken();
  await user.save({ validateBeforeSave: false });
  let url = "";
  try {
    await new mailer(user, url, token).welcomemail();
    res.status(200).json({
      status: "success",
      message: "mail sent",
    });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    res.status(500).json({
      message: err.response,
      status: "fail",
    });
  }
});
exports.login = catchAsync(async (req, res, next) => {
  let { email, password } = req.body;
  if (!email) return next(new apierror("Invalid  request", 300));
  let user = await User.findOne({ email, active: true }).select("+password");
  if (!user) return next(new apierror("Incorrect password or Email", 303));
  if (!(await user.correctPassword(password, user.password)))
    return next(new apierror("Incorrect password or Email", 403));
  let token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TIME,
  });
  res.cookie("jwt", token, {
    expires: new Date(Date.now + process.env.COOKIE_EXP * 60 * 24 * 60 * 1000),
    secure: false,
    httpOnly: false,
  });
  delete user.password;
  res.status(200).json({ status: "success", data: { token, user } });
});
exports.activate = catchAsync(async (req, res, next) => {
  let token = req.params.token;
  let email = req.params.email;
  let user = await User.findOne({
    email,
    validtill: { $gte: Date.now() },
  }).select("+passwordChangedAt");
  if (!user) return next(new apierror("The token expired", 300));
  if (!(await user.comparetoken(token, user.token)))
    return next(new apierror("The token expired", 300));
  user.active = true;
  user.token = null;
  user.validtill = null;
  user.passwordChangedAt = Date.now();
  user.save({ validateBeforeSave: false });
  res.status(200).json({ status: "success", data: { user } });
});
exports.forgetpassword = catchAsync(async (req, res, next) => {
  //   console.log(req.params);
  let email = req.params.email;
  if (!email) return next(new apiError("Invalid request", 303));
  user = await User.findOne({ email, active: true });
  if (!user) return next(new apierror("The user does not exist", 300));
  token = await user.generatetoken();
  await user.save({ validateBeforeSave: false });
  try {
    await new mailer(user, "", token).forgetpassword();
    res.status(200).json({ status: "success", message: "Mail sent" });
  } catch (err) {
    user.token = null;
    user.validtill = null;
    user.save({ validateBeforeSave: false });
    res.status(500).json({
      message: err,
      status: "failed to send mail",
    });
  }
});
exports.changepassword = catchAsync(async (req, res, next) => {
  let { password, confirmPassword, email, token } = req.body;
  let user = await User.findOne({
    email,
    validtill: { $gte: Date.now() },
  }).select("+passwordChangedAt +password ");
  if (!user) return next(new apierror("The token expired", 300));
  if (!(await user.comparetoken(token, user.token)))
    return next(new apierror("The token expired", 300));
  user.token = null;
  user.validtill = null;
  user.passwordChangedAt = Date.now();
  user.password = password;
  user.confirmPassword = confirmPassword;
  await user.save({ validateBeforeSave: true });
  delete user.confirmPassword;
  delete user.password;
  res.status(200).json({ status: "success", data: { user } });
});
exports.isProtected = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization) {
    if (req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
  }
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(new apierror("not logged in", 401));
  const data = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  let user = await User.findById(data._id);

  //  console.log(user,"isProtected");
  if (!user)
    return next(new apierror("user was deleated please login again", 401));
  if (await user.changepassword(data.iat))
    return next(new apierror("password was changed please login again", 401));
  req.user = user;
  next();
});
exports.restrictTo = (options) => {
  return (req, res, next) => {
    if (!options.includes(req.user.role))
      return next(
        new apierror("You are not allowed to access this route", 400)
      );
    next();
  };
};
exports.restrictaccess = catchAsync(async (req, res, next) => {
  let id = req.params.id;
  if (req.user.role !== "admin" && req.user._id != id)
    return next(new apierror("Not allowed to access this route", 303));
  next();
});
