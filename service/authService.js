const user_repo = require("../repository/user_repository");
const crypto = require("crypto");
const apiUtil = require("../util/apiUtil");
const { error } = require("console");

const setCookie = async (res, userId) => {
  // const value = req.body;
  // const userId = userId;
  const fileId = null; // Stores the current fileId

  const value = {
    userId: userId,
    fileId: fileId,
  };

  console.log("Cookie value : ", value);
  const valueString = JSON.stringify(value);

  try {
    res.cookie("exeb2b-cookie", valueString, {
      expires: new Date(Date.now() + 86400000),
      path: "/",
      sameSite: "None",
      secure: true,
    });
    return "Cookie successful";
  } catch (e) {
    console.log("Error setting Cookie : ", e);
    throw new Error("Cookie not set");
  }
};

const saltLength = 64;
const keyLength = 64;
const iterations = 10000;

const generateSalt = () => {
  return crypto.randomBytes(saltLength).toString("hex");
};

const hashPassword = (password, salt) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      iterations,
      keyLength,
      "sha512",
      (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve(derivedKey.toString("hex"));
        }
      }
    );
  });
};

const login = async (req, res) => {
  const credentials = req.body;

  const email = credentials.email;
  const password = credentials.password;

  const existingUser = await user_repo.findByEmail(email);

  if (existingUser) {
    const savedPassword = existingUser.password;
    const savedSalt = existingUser.salt;
    const hashedPassword = await hashPassword(password, savedSalt);
    const userId = existingUser.user_id;

    if (hashedPassword === savedPassword) {
      return { status: "valid", userId : userId }; // Existing and Valid User
    } else {
      return { status: "wrong password",userId : null }; // Existing, but invalid password
    }
  } else {
    return { status: "no user", userId : null }; // User Doesn't exist
  }
};

const register = async (req) => {
  const credentials = req.body;

  const email = credentials.email;

  // Check if email is already present or not in the DB:
  const existingUser = await user_repo.findByEmail(email);

  if (existingUser) {
    return {status: false, userId : null}; // Existing User
  }

  const password = credentials.password;
  const userId = apiUtil.generateId();

  const salt = generateSalt();

  try {
    // Encrypt password
    const hashedPassword = await hashPassword(password, salt);

    const userData = {
      user_id: userId,
      email: email,
      password: hashedPassword,
      salt: salt,
    };

    const savedFlag = await user_repo.saveUser(userData);

    if (savedFlag) {
      return {status: true, userId : userId}; // New User
    } else {
      throw new Error("Failed to save user.");
    }
  } catch (e) {
    console.log("Error in saving User in Service = ", e);
    throw new Error("Failed to save user.");
  }
};

module.exports = {
  setCookie,
  register,
  login,
};
