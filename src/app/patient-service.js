// Interacting with firebase to save data into our database
const admin = require("firebase-admin");
const db = admin.firestore();
const { formatDistanceToNow } = require("date-fns");
const { user } = require("firebase-functions/v1/auth");

module.exports = {
  addPatient: async (userId, name, gender, age, email, number, note = "") => {
    await db.collection("patients").add({
      userId: userId,
      name: name,
      gender: gender,
      age: age,
      email: email,
      number: number,
      note: note,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  },

  getPatientByUserId: async (userId) => {
    const patients = await db
      .collection("patients")
      .where("userId", "==", `${userId}`)
      .get();

    patients.forEach((doc) => {
      doc.data = doc.data();
      doc.data.gender = doc.data.gender.substring(0, 1).toUpperCase();
      const timestamp = doc.data.timestamp;
      doc.data.lastUpdate = formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
      });
    });
    return patients;
  },

  searchPatientByName: async (userId, name) => {
    const patients = await db
      .collection("patients")
      .where("userId", "==", `${userId}`)
      .where("name", "==", `${name}`)
      .get();

    patients.forEach((doc) => {
      doc.data = doc.data();
      doc.data.gender = doc.data.gender.substring(0, 1).toUpperCase();
      const timestamp = doc.data.timestamp;

      doc.data.lastUpdate = formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
      });
    });

    return patients;
  },

  sortPatientByQuery: async (userId, query) => {
    const patients = await db
      .collection("patients")
      .orderBy(`${query}`, "desc")
      .get();

    patients.forEach((doc) => {
      doc.data = doc.data();
      doc.data.gender = doc.data.gender.substring(0, 1).toUpperCase();
      const timestamp = doc.data.timestamp;

      doc.data.lastUpdate = formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
      });
    });

    return patients;
  },

  deleteReviewById: async (id) => {
    const res = await db.collection("reviews").doc(id).delete();
  },

  deleteReviewByResort: async (resortId) => {
    const reviews = await db
      .collection("reviews")
      .where("resortId", "==", `${resortId}`)
      .get();

    reviews.forEach((review) => {
      db.collection("reviews").doc(review.id).delete();
    });
  },
};
