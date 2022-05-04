const admin = require("firebase-admin");
const db = admin.firestore();
const { getUseremailById } = require("./user-service");

module.exports = {
  sendEmail: async (
    userId,
    patientName,
    contactName,
    contactInstitution,
    referralUrl
  ) => {
    const email = await getUseremailById(userId);
    if (!email) {
      return null;
    }

    await db
      .collection("mail")
      .add({
        to: `${email}`,
        message: {
          subject: `Successfully referred ${patientName} to ${contactName} with UpToHealth!`,
          html: `Hello, <br><br> Congraluations! You referred patient ${patientName} to doctor ${contactName} at ${contactInstitution}. <br>
                  To see details with all the attached files, please visit ${referralUrl}. <br><br>Best,<br>UpToHealth Team`,
        },
      })
      .then(() => console.log("Queued email for delivery!"));
  },
};
