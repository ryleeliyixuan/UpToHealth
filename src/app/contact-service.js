const admin = require("firebase-admin");
const db = admin.firestore();

module.exports = {
  addContact: async (
    userId,
    name,
    institution,
    occupation,
    email,
    number,
    note = ""
  ) => {
    await db.collection("contacts").add({
      userId: userId,
      name: name,
      institution: institution,
      occupation: occupation,
      email: email,
      number: number,
      note: note,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
};
