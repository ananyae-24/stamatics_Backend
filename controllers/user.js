const catchAsync = require("../util/catch-async");
const User = require("../model/User");
const apierror = require("../util/global-error");
const multer = require("multer");
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    let name = `user-${req.user._id}-${Date.now()}.${ext}`;
    req.body.image = name;
    cb(null, name);
  },
});
const multerfilter = (req, file, cb) => {
  console.log(file.mimetype);
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new apierror("invalid file type", 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerfilter });
exports.upload_file = upload.single("image");
exports.getone = catchAsync(async (req, res, next) => {
  let id = req.params.id;
  let user = await User.find({ _id: id, active: true });
  if (!user) return next(new apierror("THe user doesnot exist", 403));
  res.status(200).json({ status: "success", user: user[0] });
});
exports.getall = catchAsync(async (req, res, next) => {
  let users = await User.find({ active: true, role: "user" }).sort("-marks");
  res.status(200).json({ status: "success", users });
});
exports.update = catchAsync(async (req, res, next) => {
  if (req.body.role) delete req.body.role;
  if (req.body.password) delete req.body.password;
  if (req.body.email) delete req.body.email;
  let id = req.params.id;
  let user = await User.findOneAndUpdate({ _id: id }, req.body, { new: true });
  res.status(200).json({ status: "success", user });
});
exports.myquestion = catchAsync(async (req, res, next) => {
  let user = await User.findById(req.user._id);
  if (!user) return next(new apierror("User doesnot exist", 303));
  res.status(200).json({ status: "success", questions: user.questions });
});
