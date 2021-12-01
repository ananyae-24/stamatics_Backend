const express = require("express");
const auth_controller = require("../controllers/auth");
const u_q_controller = require("../controllers/question_user");

const router = express.Router();
router.route("/").get(u_q_controller.getall);
router
  .route("/:id")
  .post(
    auth_controller.isProtected,
    u_q_controller.upload_file,
    u_q_controller.make
  )
  .get(auth_controller.isProtected, u_q_controller.getone);
router
  .route("/check/:id/:qid")
  .get(u_q_controller.getcheck)
  .post(u_q_controller.update);
module.exports = router;
