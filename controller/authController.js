const express = require("express");
const router = express.Router();

const authService = require("../service/authService");

router.post("/setCookie", async (req, res, userId) => {
  console.log("Reaached to set cookie");
  const cookie = await authService.setCookie(res, userId);

  if (cookie === "Cookie successful") {
    // res.send(true);
    return true;
  } else {
    // res.send(false);
    return false;
  }
});

router.post('/login', async (req,res) => {
    try {
        console.log("Reached login controller");
        const responseStatus = await authService.login(req, res);
        console.log("responseStatus = ",responseStatus);
        const userId = responseStatus.userId;

        if (responseStatus.status === "valid"){
            const cookieFlag = await authService.setCookie(res, userId);

            if (cookieFlag){
                res.status(200).json({success: true, message : "valid"}); // User valid
            } else {
                res.status(500).json({ e: "Cookie failed" }); // Cookie failed
            }
        } else if (responseStatus.status === "wrong password") {
            res.status(200).json({success: false, message : "wrong_password"});

        } else if (responseStatus.status === "no user") {
            res.status(200).json({success: false, message : "no_user"});
        }

        // res.status(500).json({ e: "Internal Server Error" });

    } catch (e){
        console.error("Error in login :", e);
        res.status(500).json({ e: "Internal Server Error" });
    }
})

router.post("/register", async (req, res) => {
  // const credentials = req.body;
  // console.log("Credentials = ",credentials);

  try {
    const newUser = await authService.register(req, res);
    const userId = newUser.userId;

    if (newUser.status) {
        const cookieFlag = await authService.setCookie(res, userId);

        if (cookieFlag){
            res.status(200).json({success: true}); // New User
        } else {
            res.status(500).json({ e: "Cookie failed" });
        }

    } else {
        res.status(200).json({success: false}); // Existing User
    }

    // Set Cookie




  } catch (e) {
    console.error("Error in registration: ", e);
    res.status(500).json({ e: "Internal Server Error" });
  }

  // Create a userId and save in DB

  // Set the cookie on the res, with the userId
});

module.exports = router;
