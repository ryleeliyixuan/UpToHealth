const admin = require("firebase-admin");
const db = admin.firestore();
const { formatDistanceToNow } = require("date-fns");

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

  getContactById: async (id) => {
    const doc = await db.collection("contacts").doc(id).get();

    if (!doc.exists) {
      return null;
    } else {
      doc.data = doc.data();
      const timestamp = doc.data.timestamp;
      doc.data.lastUpdate = formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
      });
      return doc;
    }
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
