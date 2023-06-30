import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import {initializeApp} from "firebase-admin/app";
import {DocumentSnapshot, getFirestore} from "firebase-admin/firestore";

const app = initializeApp();
const db = getFirestore(app);

type ExpiringName = {
	name: string,
	nextCheck: Date,
	status: string,
	userUid: string,
}

type TibiaPalUser = {
	notificationEmails: string,
	userUid: string,
}

async function getExpiringNames(): Promise<ExpiringName[]> {
  const names: ExpiringName[] = [];

  const snapshot = await db.collection("expiring_names")
    .where("status", "==", "expiring")
    .where("nextCheck", "<", new Date())
    .get();
  snapshot.forEach((doc: DocumentSnapshot) =>
    names.push(doc.data() as ExpiringName)
  );

  return names;
}

async function sendEmail(expiringName: ExpiringName): Promise<void> {
  const userDoc = await db.collection("users").doc(expiringName.userUid).get();
  const user = userDoc.data() as TibiaPalUser;

  await db.collection("mail").add({
    to: user.notificationEmails,
    template: {
      name: "character-available",
      data: {
        characterName: expiringName.name,
      },
    },
  });
}

export const checkExpiringNames = onSchedule("* * * * *", async () => {
  const expiringNames: ExpiringName[] = await getExpiringNames();
  logger.info(`checking ${expiringNames.length} names`);
  for (const expiringName of expiringNames) {
    const name = expiringName.name;
    const response = await axios.get(`https://api.tibiadata.com/v3/character/${name}`);
    const apiName = response.data.characters.character.name;

    const expired = !apiName || apiName === "";
    if (!expired) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      expiringName.nextCheck = now;
    } else {
      logger.info(name, "expired");
      expiringName.status = "available";
      await sendEmail(expiringName);
    }

    await db.collection("expiring_names")
      .doc(expiringName.name)
      .set(expiringName);
  }
});


