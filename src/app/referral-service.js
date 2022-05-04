const admin = require("firebase-admin");
const db = admin.firestore();
const { formatDistanceToNow } = require("date-fns");
const { sendEmail } = require("./email-service");

module.exports = {
  addReferral: async (
    userId,
    patientId,
    contactId,
    note = "",
    patientName,
    contactName,
    contactInstitution,
    contactOccupation,
    files
  ) => {
    const doc = await db.collection("referrals").add({
      userId: userId,
      patientId: patientId,
      patientName: patientName,
      contactId: contactId,
      contactName: contactName,
      contactInstitution: contactInstitution,
      contactOccupation: contactOccupation,
      note: note,
      files: files,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    const referralUrl =
      "https://uptohealth-cornell-tech.firebaseapp.com/referrals/" + doc.id;
    return sendEmail(
      userId,
      patientName,
      contactName,
      contactInstitution,
      referralUrl
    );
  },

  getReferralByUserId: async (userId) => {
    const referrals = await db
      .collection("referrals")
      .where("userId", "==", `${userId}`)
      .get();

    referrals.forEach((doc) => {
      doc.data = doc.data();
      const timestamp = doc.data.timestamp;
      doc.data.lastUpdate = formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
      });
    });
    return referrals;
  },

  getReferralByPatientId: async (patientId) => {
    const referrals = await db
      .collection("referrals")
      .where("patientId", "==", `${patientId}`)
      .get();

    referrals.forEach((doc) => {
      doc.data = doc.data();
      const timestamp = doc.data.timestamp;
      doc.data.lastUpdate = formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
      });
    });
    return referrals;
  },

  getReferralByContactId: async (contactId) => {
    const referrals = await db
      .collection("referrals")
      .where("contactId", "==", `${contactId}`)
      .get();

    referrals.forEach((doc) => {
      doc.data = doc.data();
      const timestamp = doc.data.timestamp;
      doc.data.lastUpdate = formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
      });
    });
    return referrals;
  },

  getReferralById: async (id) => {
    const doc = await db.collection("referrals").doc(id).get();

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
};
