const admin = require("firebase-admin");
const db = admin.firestore();
const { formatDistanceToNow } = require("date-fns");

module.exports = {
  addReferral: async (userId, patientId, contactId, note = "") => {
    await db.collection("referrals").add({
      userId: userId,
      patientId: patientId,
      contactId: contactId,
      note: note,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  },

  getContactByUserId: async (userId) => {
    const contacts = await db
      .collection("contacts")
      .where("userId", "==", `${userId}`)
      .get();

    contacts.forEach((doc) => {
      doc.data = doc.data();
      const timestamp = doc.data.timestamp;
      doc.data.lastUpdate = formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
      });
    });
    return contacts;
  },

  searchContactByName: async (userId, name) => {
    const contacts = await db
      .collection("contacts")
      .where("userId", "==", `${userId}`)
      .where("name", "==", `${name}`)
      .get();

    contacts.forEach((doc) => {
      doc.data = doc.data();
      const timestamp = doc.data.timestamp;
      doc.data.lastUpdate = formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
      });
    });

    return contacts;
  },
};
