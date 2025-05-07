const express = require("express");
const app = express();
const userModel = require("./models/usermodel");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const postModel = require("./models/post");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", async (req, res) => {
  const { name, email, password, username, age } = req.body;

  try {
    let user = await userModel.findOne({ email: email });
    if (user) {
      return res.status(400).send("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      username,
      age,
      posts: [],
    });

    await newUser.save();

    const token = jwt.sign(
      {
        email: email,
        userid: newUser._id,
      },
      "secretkey"
    );

    res.cookie("token", token, { httpOnly: true }); // Add secure: true in production
    res.status(200).send("User registered successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).send("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign(
        { email: user.email, userid: user._id },
        "secretkey"
      );

      res.cookie("token", token, { httpOnly: true });
      return res.redirect("/profile");
    } else {
      return res.redirect("/login");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Login error");
  }
});

app.get("/logout", (req, res) => {
  res.cookie("token", "", { httpOnly: true });
  res.redirect("/login");
});

app.get("/profile", isProtected, async (req, res) => {
 let user = await userModel.findOne({email: req.user.email}).populate("posts").lean();
 res.render("profile", { user });
});

app.post("/post", isProtected, async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const { content } = req.body;

    const post = await postModel.create({
      user: user._id,
      content,
    });

    // Ensure user.posts exists as an array
    if (!Array.isArray(user.posts)) {
      user.posts = [];
    }

    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
  } catch (err) {
    console.error("Post Creation Error:", err);
    res.status(500).send("Server error while creating post");
  }
});


// ✅ Fixed Middleware
function isProtected(req, res, next) {
  const token = req.cookies.token;

  if (!token || token === " ") {
    return res.redirect("/login");
  }

  try {
    const data = jwt.verify(token, "secretkey");
    req.user = data;
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    return res.redirect("/login");
  }
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
