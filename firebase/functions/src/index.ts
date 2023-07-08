import {onSchedule} from "firebase-functions/v2/scheduler";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import {initializeApp} from "firebase-admin/app";
import {getMessaging} from "firebase-admin/messaging";
import {DocumentSnapshot, getFirestore} from "firebase-admin/firestore";

const app = initializeApp();
const db = getFirestore(app);

type ExpiringName = {
  id: string,
  name: string,
  status: string,
  userUid: string,
  nextCheck: Date,
  lastChecked: Date,
}

type TibiaPalUser = {
  notificationEmails: string,
  userUid: string,
}

async function getExpiringNames(): Promise<ExpiringName[]> {
  const names: ExpiringName[] = [];

  const snapshot = await db.collection("expiring_names")
    .where("status", "==", "expiring")
    // .where("nextCheck", "<", new Date())
    .get();
  snapshot.forEach((doc: DocumentSnapshot) => {
    names.push({id: doc.id, ...doc.data()} as ExpiringName)
  });

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
    }, });
}

export const checkExpiringNames = onSchedule("*/10 * * * *", async () => {
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

    expiringName.lastChecked = new Date(); 
    await db.collection("expiring_names")
      .doc(expiringName.id)
      .set(expiringName);
  }
});

type World = {
  onlinePlayers: string[]
}
  
const worldConverter = {
  toFirestore: (data: World) => data,
  fromFirestore:( doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as World
}

const worldCollection = db.collection("worlds").withConverter(worldConverter); 


function arrayEquals(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const sortA = [...a].sort();
  const sortB = [...b].sort();
  for (let i = 0; i < sortA.length; i++) {
    if (sortA[i] !== sortB[i]) {
      return false;
    }
  }

  return true;
}

export const updateWorldOnlinePlayers = onSchedule("* * * * *", async () => {
  const qSnapshot = await worldCollection.get()
  qSnapshot.forEach(async (doc) => {
    const worldName = doc.id
    logger.info("Processing world:", worldName)
 
    const response = await axios.get(`https://api.tibiadata.com/v3/world/${worldName}`);
    if (response.status != 200) {
      logger.error("unable to retrieve world info", response.status, response.data)
      return;
    }

    const players: [{name: string}] = response.data.worlds.world.online_players
    const onlinePlayers = players.map((player) => player.name);

    const oldOnlinePlayers = doc.data().onlinePlayers
    if (arrayEquals(oldOnlinePlayers, onlinePlayers)) {
      return;
    }

    const trackingPlayers  = new Set<string>()
    const trackerPlayersDocs = await db.collection("tracking_players").get()
    trackerPlayersDocs.docs.forEach((doc) => trackingPlayers.add(doc.data().player))

    const loggedInPlayers = onlinePlayers.filter((onlinePlayer) => !oldOnlinePlayers.includes(onlinePlayer) && trackingPlayers.has(onlinePlayer))
    const loggedOutPlayers = oldOnlinePlayers.filter((oldOnlinePlayer) => !onlinePlayers.includes(oldOnlinePlayer) && trackingPlayers.has(oldOnlinePlayer))

    const writes = loggedInPlayers.map((player) => {
      return {name: player, status: "online", world: worldName}
    })
    const writes2 = loggedOutPlayers.map((player) => {
      return {name: player, status: "offline", world: worldName}
    })

    const final = writes.concat(writes2)

    logger.debug("loaded tracking players", trackingPlayers)
    logger.debug("writing to database", final)

    const batch = db.batch()
    for (const write of final) {
      batch.set(db.collection("players").doc(write.name), write)
    }
    batch.set(worldCollection.doc(doc.id), {onlinePlayers})
    await batch.commit()
  });
});


export const addWorldBasedOnPlayers = onDocumentCreated("players/{playerName}", async (event) => {
  const friendDoc = event.data;
  const worldName = friendDoc.data().world
  const doc = await worldCollection.doc(worldName).get()
  if (doc.exists) {
    return;
  }
  logger.info("Adding new world:", worldName);
  await worldCollection.doc(worldName).set({onlinePlayers: []})
});

export const notifyOnPlayerChanges = onDocumentUpdated("players/{playerName}", async (event) => {
  const playerName = event.params.playerName;

  logger.info(`Processing ${event.params.playerName}`)
  const beforePlayer = event.data.before.data();
  const newPlayerDoc = event.data.after.data();
  logger.info(beforePlayer, newPlayerDoc);


  if (beforePlayer.status === newPlayerDoc.status) {
    return;
  }

  const trackingUserId = new Set<string>();
  const trackingDocs = await db.collection("tracking_players").where("player", "==", playerName).get();
  trackingDocs.docs.forEach((doc) => trackingUserId.add(doc.data().userUid));

  logger.debug(trackingDocs.docs)
  logger.debug(trackingUserId)

  for (const userUid of trackingUserId) {
    const userDocs = await db.collection("notification_tokens").where("userUid", "==", userUid).get();
    const tokens: string[] = []
    userDocs.docs.forEach((doc) => tokens.push(doc.id));

    const message = {
      notification: {
        title: "VIP List",
        body: `${playerName} is ${newPlayerDoc.status}` 
      },
      tokens,
    };
    getMessaging().sendEachForMulticast(message)
      .then((response) => {
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(tokens[idx]);
            }
          });
          logger.error("List of tokens that caused failures: " + failedTokens);
        }
      })
      .catch((error) => {
        logger.error("Error sending message:", error);
      });
  }

});

