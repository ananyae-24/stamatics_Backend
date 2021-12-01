const express = require("express");
const auth_controller = require("../controllers/auth");
const question_controller = require("../controllers/question");
const router = express.Router();
router.use(auth_controller.isProtected);
router
  .route("/")
  .get(question_controller.all)
  .post(question_controller.upload_file, question_controller.makeQuestion);
router
  .route("/:id")
  .get(question_controller.getOne)
  .post(question_controller.upload_file, question_controller.editQuestion)
  .delete(question_controller.delete);
module.exports = router;
