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
const authMiddleware = require("./app/auth-middleware");
const PatientService = require("./app/patient-service");
const ContactService = require("./app/contact-service");
const ReferralService = require("./app/referral-service");

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
  res.render("pages/dashboard", { user: req.user });
});

// PATIENT
app.get("/patients", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const patients = await PatientService.getPatientByUserId(userId);
  res.render("pages/patients/show", {
    userId: req.user.sub,
    items: patients,
    searchName: "",
  });
});

app.get("/patients/:id", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const id = req.params.id;
  const patient = await PatientService.getPatientById(id);
  const referrals = await ReferralService.getReferralByPatientId(id);

  res.render("pages/patients/detail", {
    userId: req.user.sub,
    item: patient,
    referrals: referrals,
  });
});

app.post("/patients", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  console.log("Files: ", req.body);
  const { name, gender, age, email, number, note, files } = req.body;
  PatientService.addPatient(
    userId,
    name,
    gender,
    age,
    email,
    number,
    note,
    files
  ).then(() => {
    res.redirect("/patients");
  });
});

app.post("/patients/search", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const { name } = req.body;

  var patients;
  if (!name || name.trim() == "") {
    patients = await PatientService.getPatientByUserId(userId);
  } else {
    patients = await PatientService.searchPatientByName(userId, name);
  }
  res.render("pages/patients/show", {
    userId: req.user.sub,
    items: patients,
    searchName: name,
  });
});

app.get("/patients/sortby/:query", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const { query } = req.params;
  const patients = await PatientService.sortPatientByQuery(userId, query);
  res.render("pages/patients/show", {
    userId: req.user.sub,
    items: patients,
    searchName: "",
  });
});

// CONTACTS
app.get("/contacts", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const contacts = await ContactService.getContactByUserId(userId);
  res.render("pages/contacts/show", {
    userId: req.user.sub,
    items: contacts,
    searchName: "",
  });
});

app.get("/contacts/:id", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const id = req.params.id;
  const contact = await ContactService.getContactById(id);
  const referrals = await ReferralService.getReferralByContactId(id);

  res.render("pages/contacts/detail", {
    userId: req.user.sub,
    item: contact,
    referrals: referrals,
  });
});

app.post("/contacts", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const { name, institution, occupation, email, number, note } = req.body;
  ContactService.addContact(
    userId,
    name,
    institution,
    occupation,
    email,
    number,
    note
  ).then(() => {
    res.redirect("/dashboard");
  });
});

app.post("/contacts/search", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const { name } = req.body;

  var contacts;
  if (!name || name.trim() == "") {
    contacts = await ContactService.getContactByUserId(userId);
  } else {
    contacts = await ContactService.searchContactByName(userId, name);
  }

  res.render("pages/contacts/show", {
    userId: req.user.sub,
    items: contacts,
    searchName: name,
  });
});

// REFERRAL
app.get("/referrals", authMiddleware, async function (req, res) {
  const userId = req.user.sub;
  const referrals = await ReferralService.getReferralByUserId(userId);

  res.render("pages/referrals/show", {
    userId: req.user.sub,
    items: referrals,
  });
});

app.get("/referrals/:id", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const id = req.params.id;
  const referral = await ReferralService.getReferralById(id);

  res.render("pages/referrals/detail", {
    userId: req.user.sub,
    item: referral,
  });
});

app.get("/referral", authMiddleware, async function (req, res) {
  const userId = req.user.sub;
  const contacts = await ContactService.getContactByUserId(userId);
  const patients = await PatientService.getPatientByUserId(userId);

  res.render("pages/referrals/new", {
    userId: req.user.sub,
    patients: patients,
    contacts: contacts,
  });
});

app.post("/referrals", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const { patientId, contactId, note, files } = req.body;
  const p = await PatientService.getPatientById(patientId);
  const c = await ContactService.getContactById(contactId);
  const patientName = p.data.name;
  const contactName = c.data.name;
  const contactInstitution = c.data.institution;
  const contactOccupation = c.data.occupation;

  ReferralService.addReferral(
    userId,
    patientId,
    contactId,
    note,
    patientName,
    contactName,
    contactInstitution,
    contactOccupation,
    files
  ).then(() => {
    res.redirect("/referrals");
  });
});

exports.app = functions.https.onRequest(app);
// app.listen(port);
// console.log("Server started at http://localhost:" + port);
