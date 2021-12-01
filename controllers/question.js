const catchAsync = require("../util/catch-async");
const Question = require("../model/Question");
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
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype.startsWith("application")
  ) {
    cb(null, true);
  } else {
    cb(new apierror("invalid file type", 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerfilter });
exports.upload_file = upload.single("image");
exports.makeQuestion = catchAsync(async (req, res, next) => {
  let question = await Question.create(req.body);
  res.status(200).json({ status: "success", question });
});
exports.editQuestion = catchAsync(async (req, res, next) => {
  let id = req.params.id;
  let question = await Question.findOneAndUpdate({ _id: id }, req.body, {
    new: true,
  });
  res.status(200).json({ status: "success", question });
});
exports.getOne = catchAsync(async (req, res, next) => {
  let id = req.params.id;
  let question = await Question.findById(id);
  if (!question) next(new apierror("Question got deleted", 303));
  res.status(200).json({ status: "success", question });
});
exports.all = catchAsync(async (req, res, next) => {
  let questions = await Question.find().sort("title");
  res.status(200).json({ status: "success", questions });
});
exports.delete = catchAsync(async (req, res, next) => {
  let id = req.params.id;
  await Question.deleteOne({ _id: id });
  res.status(200).json({ status: "success" });
});
