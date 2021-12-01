const catchAsync = require("../util/catch-async");
const User = require("../model/User");
const Question = require("../model/Question");
const U_Q = require("../model/Question-User");
const apierror = require("../util/global-error");
const multer = require("multer");
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    let name = `user-${req.user._id}-${Date.now()}.${ext}`;
    req.body.answer = name;
    cb(null, name);
  },
});
const multerfilter = (req, file, cb) => {
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
exports.upload_file = upload.single("answer");
exports.getall = catchAsync(async (req, res, next) => {
  let u_q = await U_Q.find({}).populate("question person").sort("checked");
  res.status(200).json({ status: "success", u_q });
});
exports.make = catchAsync(async (req, res, next) => {
  let person = req.user._id;
  let user = await User.findById(person);
  if (!user) return next(new apierror("Invalid submission", 303));
  let question = req.params.id;
  user.questions.push(question);
  let q = await Question.findById(question);
  if (!q) return next(new apierror("Invalid submission", 303));
  let body = { ...req.body, person, question };
  await U_Q.create(body);
  q.solvedby = q.solvedby + 1;
  await q.save({ validateBeforeSave: false });
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ status: "success", message: "Answer saved" });
});
exports.getone = catchAsync(async (req, res, next) => {
  let person = req.user._id;
  let question = req.params.id;
  let answer = await U_Q.findOne({ person, question });
  if (!answer) return next(new apierror("Resource not found", 403));
  res.status(200).json({ status: "success", answer });
});
exports.getcheck = catchAsync(async (req, res, next) => {
  let person = req.params.id;
  let question = req.params.qid;
  let answer = await U_Q.findOne({ person, question }).populate("question");
  if (!answer) return next(new apierror("Resource not found", 403));
  res.status(200).json({ status: "success", answer });
});
exports.update = catchAsync(async (req, res, next) => {
  let person = req.params.id;
  let question = req.params.qid;
  if (req.body.checked) {
    let user = await User.findById(person);
    if (!user) return next(new apierror("User doesnot exist", 303));
    if (!user.questions.includes(question)) user.questions.push(question);

    let answer = await U_Q.findOne({ person, question });
    if (answer) user.marks = user.marks - answer.marks;
    user.marks = user.marks + parseFloat(req.body.marks);
    // console.log(user);
    // if(!answer) await U_Q.create({ req})
    await user.save({ validateBeforeSave: false });
  }
  let answer = await U_Q.findOneAndUpdate({ person, question }, req.body, {
    new: true,
  });

  res.status(200).json({ status: "success", answer });
});
