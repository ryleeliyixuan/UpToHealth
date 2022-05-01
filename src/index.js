const functions = require("firebase-functions");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
const port = process.env.PORT || 8080;
const serviceAccount = require("../config/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const UserService = require("./app/user-service");
const ResortService = require("./app/resort-service");
const ReviewService = require("./app/review-service");
const authMiddleware = require("./app/auth-middleware");
const PatientService = require("./app/patient-service");

const ejsMate = require("ejs-mate");
app.engine("ejs", ejsMate);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/static", express.static("static/"));

app.use((req, res, next) => {
  res.locals.user = req.cookies.__session;
  next();
});

// use res.render to load up an ejs view file index page
app.get("/", function (req, res) {
  res.render("pages/index");
});

app.post("/sessionLogin", (req, res) => {
  const idToken = req.body.idToken.toString();
  const { name, institution } = req.body;
  const signInType = req.body.signInType;

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("__session", sessionCookie, options);

        admin
          .auth()
          .verifySessionCookie(sessionCookie, true)
          .then((userData) => {
            req.user = userData;
            const id = userData.sub;
            const email = userData.email;

            if (signInType === "register") {
              UserService.createUser(id, email, name, institution).then(() => {
                res.end(
                  JSON.stringify({ status: "success - saved to firebase!" })
                );
              });
            } else {
              UserService.getUsernameById(id).then((name) => {
                res.end(JSON.stringify({ status: "success" }));
              });
            }
          });
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

app.get("/sign-in", function (req, res) {
  res.render("pages/users/sign-in");
});

app.get("/sign-up", function (req, res) {
  res.render("pages/users/sign-up");
});

app.get("/log-out", function (req, res) {
  res.redirect("/sessionLogout");
});

app.get("/sessionLogout", (req, res) => {
  res.clearCookie("__session");
  res.redirect("/sign-in");
});

app.get("/dashboard", authMiddleware, async function (req, res) {
  // const feed = await ResortService.getAllResorts();
  res.render("pages/dashboard", { user: req.user });
});

app.post("/patients", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const { name, gender, age, email, number, note } = req.body;
  PatientService.addPatient(
    userId,
    name,
    gender,
    age,
    email,
    number,
    note
  ).then(() => {
    res.redirect("/dashboard");
  });
});

// =============

app.get("/resorts", authMiddleware, async function (req, res) {
  res.render("pages/resorts/new");
});

// TODO: SHOW RESORTS
app.get("/resorts/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  const userId = req.user.sub;
  const resort = await ResortService.getResortById(id);
  const reviews = await ReviewService.getReviewByResort(id);

  res.render("pages/resorts/show", {
    resort: resort,
    userId: userId,
    reviews: reviews,
  });
});

// TODO: DELETE RESORTS
app.post("/resorts/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const resort = await ResortService.deleteResortById(id);
  const review = await ReviewService.deleteReviewByResort(id);
  res.redirect("/dashboard");
});

// TODO: SUBMIT REVIEWS
app.post("/resorts/:id/reviews", authMiddleware, async (req, res) => {
  const resortId = req.params.id;
  const { rating, body } = req.body;
  const userId = req.user.sub;
  const username = req.user.email;
  const review = await ReviewService.createReview(
    resortId,
    userId,
    username,
    rating,
    body
  );
  const location = "/resorts/" + resortId;
  res.redirect(location);
});

// TODO: DELETE REVIEWS
app.post(
  "/resorts/:resortId/reviews/:reviewId",
  authMiddleware,
  async (req, res) => {
    const { resortId, reviewId } = req.params;
    const review = await ReviewService.deleteReviewById(reviewId);
    const location = "/resorts/" + resortId;
    res.redirect(location);
  }
);

// exports.app = functions.https.onRequest(app);
app.listen(port);
console.log("Server started at http://localhost:" + port);
