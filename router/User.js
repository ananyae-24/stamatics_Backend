const express = require("express");
const user_controller = require("../controllers/auth");
const profile_controller = require("../controllers/user");
const router = express.Router();
router.route("/signup").post(user_controller.signup);
router.route("/login").post(user_controller.login);
router.route("/activate/:email/:token").get(user_controller.activate);
router.route("/forgot/:email").get(user_controller.forgetpassword);
router.route("/changepasssword").post(user_controller.changepassword);
router.use(user_controller.isProtected);
router.route("/all").get(profile_controller.getall);
router
  .route("/profile/:id")
  .get(profile_controller.getone)
  .post(
    user_controller.restrictaccess,
    profile_controller.upload_file,
    profile_controller.update
  );
router
  .route("/question")
  .get(user_controller.isProtected, profile_controller.myquestion);
module.exports = router;
