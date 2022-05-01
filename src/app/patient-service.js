// Interacting with firebase to save data into our database
const admin = require("firebase-admin");
const db = admin.firestore();

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
      // console.log(doc.id, "=>", doc.data);
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
