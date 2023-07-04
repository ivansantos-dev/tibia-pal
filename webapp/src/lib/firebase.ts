import { initializeApp } from 'firebase/app';
import {
	doc,
	setDoc,
	getFirestore,
	collection,
	getDocs,
	getDoc,
	deleteDoc,
	onSnapshot,
	where,
	query,
	DocumentSnapshot,
	QuerySnapshot,
	Timestamp,
	addDoc,
	QueryDocumentSnapshot,
} from 'firebase/firestore';
import { NameState } from './tibia_client';
import {
	type User,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	getAuth,
	signOut,
    type Unsubscribe
} from 'firebase/auth';
import { get, writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import {onMessage,  getToken, getMessaging} from 'firebase/messaging';

export const firebaseConfig = {
	apiKey: 'AIzaSyA7Zj56RE-zq3NuVU1QeZuXP8_RPFxlNRY',
	authDomain: 'tibia-1fcfa.firebaseapp.com',
	projectId: 'tibia-1fcfa',
	storageBucket: 'tibia-1fcfa.appspot.com',
	messagingSenderId: '244551684591',
	appId: '1:244551684591:web:ec0b7e554422245ff7a61a'
};

const firebaseMessagingConfig ={ 
	vapidKey: 'BLoJY3mZOwweR3KemCGlgFArwTfGh2PUzV2ssE_JSxUlQlUyeEZQN3PqoyjbQUvxz_pE1NwiBGm2bqBozld_5mo'
}


type TrackingPlayer = {
	player: string,
	userUid: string
}

type Player = {
	name: string,
	world: string,
	status: "online" | "offline",
}

type ExpiringName = {
	id: string,
	name: string,
	status: string, 
	nextCheck: Timestamp,
	lastChecked: Timestamp,
	userUid: string,
}

const playerConverter = {
  toFirestore: (data: Player) => data,
  fromFirestore:(doc: QueryDocumentSnapshot) => doc.data() as Player
}

export const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const userStore: Writable<User | null> = writable(null);
export const expiringNamesStore = createExpiringNameStore();
export const friendListStore = createFriendListStore();
export const profileStore = createProfileStore();

if (browser) {
	onAuthStateChanged(auth, (user) => {
		userStore.set(user);
	});

	const messaging = getMessaging(app);
	onMessage(messaging, (payload) => {
		new Notification('Tibia Pal Internal', payload.notification)
	});
}

function createFriendListStore() {
	let unsubscribe: Unsubscribe = () => null
	// let unsubscribeTracking: Unsubscribe = () => null TODO add listener on trackingcollection so that we online resubscribe when deleting instead of recreating the entire set
	const {subscribe, set } = writable<Player[]>([]);

	const playersCollection = collection(db, "players").withConverter(playerConverter);
	const trackingCollection = collection(db, "tracking_players");

	async function realtimeSubscription() {
		unsubscribe()
		const uid = auth.currentUser?.uid
		const q = query(trackingCollection, where("userUid", "==", uid))
		const docs = await getDocs(q);
		const names = docs.docs.map((doc) => { 
			return 	(doc.data() as TrackingPlayer).player
		});
		if (names.length == 0) {
			set([])
			return;
		}
		const playerQuery = query(playersCollection, where("name", 'in', names));
		const playersDocs = await getDocs(playerQuery);
		const players = playersDocs.docs.map((doc) => doc.data());
		set(players)
		
		unsubscribe = onSnapshot(playerQuery, (querySnapshot: QuerySnapshot) => {
			const names: Player[] = []
			querySnapshot.forEach((doc: DocumentSnapshot) => {
				names.push(doc.data() as Player)
				}
			);
			set(names)
		});
	}

	return {
		subscribe,
		add: async (name: string, world: string) =>  {
		const userUid = auth.currentUser?.uid
		await addDoc(trackingCollection, {
				player: name,
				userUid
			});
			await setDoc(doc(playersCollection, name), {
				name,
				world,
				status: "offline" // TODO not set unknown to everybody
				}, {merge: true});

			realtimeSubscription();
		},
		delete: async(deletePlayer: string) => {
			// TODO not have to lookup data
			const userUid = auth.currentUser?.uid
			// TODO enforce auth for userUid for tracking_players
			const trackingQuery = query(trackingCollection, where('player', '==', deletePlayer), where('userUid', '==', userUid))
			const docs = await getDocs(trackingQuery)

			docs.docs.forEach(async (docSnapshot) => {
				await deleteDoc(doc(trackingCollection, docSnapshot.id))
			});

			realtimeSubscription()
		},
		load: async () => {
			realtimeSubscription()
		},
		destroy: () => {
			unsubscribe()
		}
	}
}

function createExpiringNameStore() {
	let unsubscribe: Unsubscribe = () => null

	const { subscribe, set } = writable<ExpiringName[]>([])

	return {
		subscribe,
		add: async (name: string) => {
			const uid = get(userStore)?.uid 
		const now = new Date().getTime();
		await addDoc(collection(db, 'expiring_names'), {
				name,
				status: NameState[NameState.expiring],
				lastChecked: now,
				nextCheck: new Date(now + 1 * 60 * 60 * 1000),
				userUid: uid,
			});
		},
		delete: async(id: string)  => {
			await deleteDoc(doc(db, 'expiring_names', id));
		},
		load: async () => {
			const uid = auth.currentUser?.uid
			const collections = collection(db, 'expiring_names');
			const q = query(collections, where("userUid", "==", uid))
			const docs = await getDocs(q);
			const formerNames = docs.docs.map((doc) =>{ return {id:doc.id,...doc.data()} as ExpiringName});
			set(formerNames)
			unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot) => {
				const names: ExpiringName[] = []
				querySnapshot.forEach((doc: DocumentSnapshot) => {
					names.push({id: doc.id, ...doc.data()} as ExpiringName)
					}
				);
				set(names)
			});
		},
		destroy: () => unsubscribe()
	}
}

type PalUser = {
	notificationEmails: string,
	enableNotificationEmail: boolean,
}

function createProfileStore() {
	let unsubscribe: Unsubscribe = () => null;

	const { subscribe, set } = writable<PalUser>({notificationEmails:'', enableNotificationEmail:false})

	return {
		subscribe,
		load: async () => {
			const uid = get(userStore)!.uid 
			const docRef = doc(db, 'users', uid)
			const docSnapshot = await getDoc(docRef)
			set(docSnapshot.data() as PalUser);

			unsubscribe = onSnapshot(docRef, (doc) => {
				set(doc.data() as PalUser);
			});
		},
		save: async (enableNotificationEmail: boolean, notificationEmails: string) => {
			const uid = get(userStore)!.uid 
			await setDoc(doc(db, 'users', uid), {
				enableNotificationEmail,
				notificationEmails,
			});
		},
		notificationRequestPermission: () => {
			Notification.requestPermission().then((permission) => {
				if (permission !== "granted") {
					console.debug("permission not granted")
					return;
				}
				const messaging = getMessaging();
				getToken(messaging, firebaseMessagingConfig)
					.then(async (currentToken) => {
						if (currentToken) {
							const uid = get(userStore)!.uid;
							await setDoc(doc(db, 'users', uid), { token: currentToken }, {merge: true});
						} else {
							alert('No registration token available. Request permission to generate one.');
						}
					}).catch((err) => {
						console.log(err)
						alert('An error occurred while retrieving token');
				});
			});
		},
		destroy: () => {
			unsubscribe()
		}
	}

}

export async function login(email: string, password: string) {
	await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
	await signOut(auth);
}
