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
	QueryDocumentSnapshot
} from 'firebase/firestore';
import { NameState } from './tibia_client';
import {
	type User,
	onAuthStateChanged,
	getAuth,
	signOut,
	type Unsubscribe,
	GoogleAuthProvider,
	type Auth,
	signInWithPopup,
    deleteUser
} from 'firebase/auth';
import { get, readable, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { onMessage, getToken, getMessaging } from 'firebase/messaging';

export const firebaseConfig = {
	apiKey: 'AIzaSyA7Zj56RE-zq3NuVU1QeZuXP8_RPFxlNRY',
	authDomain: 'tibia-1fcfa.firebaseapp.com',
	projectId: 'tibia-1fcfa',
	storageBucket: 'tibia-1fcfa.appspot.com',
	messagingSenderId: '244551684591',
	appId: '1:244551684591:web:ec0b7e554422245ff7a61a'
};

const firebaseMessagingConfig = {
	vapidKey:
		'BLoJY3mZOwweR3KemCGlgFArwTfGh2PUzV2ssE_JSxUlQlUyeEZQN3PqoyjbQUvxz_pE1NwiBGm2bqBozld_5mo'
};

type TrackingPlayer = {
	player: string;
	userUid: string;
};

type Player = {
	name: string;
	world: string;
	status: 'online' | 'offline';
};

type ExpiringName = {
	id: string;
	name: string;
	status: string;
	nextCheck: Timestamp;
	lastChecked: Timestamp;
	userUid: string;
};

export type UserSettings = {
	enableEmailNotification: boolean,
	emailSettings: {
		emails: string, 
		enableFormerNames: boolean,
	},
	enablePushNotification: boolean,
	pushSettings: {
		enableFormerNames: boolean,
		enableVipList: boolean,
	}	
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const converter = <T>() => ({
	toFirestore: (data: Partial<T>) => data,
	fromFirestore: (snap: QueryDocumentSnapshot) => {
		return { id: snap.id, ...snap.data() } as T;
	}
});

const typedCollection = <T>(collectionPath: string) =>
	collection(db, collectionPath).withConverter(converter<T>());

const expiringNamesCollection = typedCollection<ExpiringName>('expiring_names');
const playersCollection = typedCollection<Player>('players');
const trackingPlayerCollection = typedCollection<TrackingPlayer>('tracking_players');

export const userStore = createUserStore(auth);
export const expiringNamesStore = createExpiringNameStore();
export const friendListStore = createFriendListStore();
export const profileStore = createProfileStore();

if (browser) {
	const messaging = getMessaging(app);
	onMessage(messaging, (payload) => {
		new Notification('Tibia Pal Internal', payload.notification);
	});
}

function createUserStore(auth: Auth) {
	const { subscribe } = readable<User | null>(undefined, (set) => {
		const unsubscribe = onAuthStateChanged(auth, (user) => set(user));
		return () => unsubscribe();
	});

	async function login() {
		await signInWithPopup(auth, new GoogleAuthProvider());
		profileStore.sendToken();
	}

	async function logout() {
		profileStore.deleteToken()
		await signOut(auth);
	}

	return {
		subscribe,
		login,
		logout
	};
}

function createFriendListStore() {
	let unsubscribe: Unsubscribe = () => null;
	// let unsubscribeTracking: Unsubscribe = () => null TODO add listener on trackingcollection so that we online resubscribe when deleting instead of recreating the entire set
	const { subscribe, set } = writable<Player[]>([]);

	const trackingCollection = collection(db, 'tracking_players');

	async function realtimeSubscription() {
		unsubscribe();
		const uid = auth.currentUser?.uid;
		const q = query(trackingPlayerCollection, where('userUid', '==', uid));
		const docs = await getDocs(q);
		const names = docs.docs.map((doc) => doc.data().player);
		if (names.length == 0) {
			set([]);
			return;
		}

		const playerQuery = query(playersCollection, where('name', 'in', names));
		const playersDocs = await getDocs(playerQuery);
		const players = playersDocs.docs.map((doc) => doc.data() as Player);
		set(players);

		unsubscribe = onSnapshot(playerQuery, (querySnapshot: QuerySnapshot) => {
			const names: Player[] = [];
			querySnapshot.forEach((doc: DocumentSnapshot) => {
				names.push(doc.data() as Player);
			});
			set(names);
		});
	}

	return {
		subscribe,
		add: async (name: string, world: string) => {
			const userUid = getUserUid();
			await addDoc(trackingCollection, {
				player: name,
				userUid
			});
			await setDoc(
				doc(playersCollection, name),
				{
					name,
					world,
					status: 'offline' // TODO not set unknown to everybody
				},
				{ merge: true }
			);

			realtimeSubscription();
		},
		delete: async (deletePlayer: string) => {
			// TODO not have to lookup data
			const userUid = auth.currentUser?.uid;
			// TODO enforce auth for userUid for tracking_players
			const trackingQuery = query(
				trackingCollection,
				where('player', '==', deletePlayer),
				where('userUid', '==', userUid)
			);
			const docs = await getDocs(trackingQuery);

			docs.docs.forEach(async (docSnapshot) => {
				await deleteDoc(doc(trackingCollection, docSnapshot.id));
			});

			realtimeSubscription();
		},
		load: async () => {
			realtimeSubscription();
		},
		destroy: () => {
			unsubscribe();
		}
	};
}

function createExpiringNameStore() {
	let unsubscribe: Unsubscribe = () => null;

	const { subscribe, set } = writable<ExpiringName[]>([]);

	return {
		subscribe,
		add: async (name: string) => {
			const uid = getUserUid();
			const now = new Date();
			await addDoc(collection(db, 'expiring_names'), {
				name,
				status: NameState[NameState.expiring],
				lastChecked: now,
				nextCheck: new Date(now.getTime() + 1 * 60 * 60 * 1000),
				userUid: uid
			});
		},
		delete: async (id: string) => {
			await deleteDoc(doc(db, 'expiring_names', id));
		},
		load: async () => {
			const uid = auth.currentUser?.uid;
			const q = query(expiringNamesCollection, where('userUid', '==', uid));
			const docs = await getDocs(q);
			const formerNames = docs.docs.map((doc) => {
				return { id: doc.id, ...doc.data() } as ExpiringName;
			});
			set(formerNames);
			unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot) => {
				const names: ExpiringName[] = [];
				querySnapshot.forEach((doc: DocumentSnapshot) => {
					names.push({ id: doc.id, ...doc.data() } as ExpiringName);
				});
				set(names);
			});
		},
		destroy: () => unsubscribe()
	};
}

function getUserUid() {
	return get(userStore)!.uid;
}

function createProfileStore() {
	let unsubscribe: Unsubscribe = () => null;

	const { subscribe, set } = writable<UserSettings>({
		enableEmailNotification:  false,
		emailSettings: {
			emails: '', 
			enableFormerNames: true,
		},
		enablePushNotification:  false,
		pushSettings: {
			enableFormerNames: true,
			enableVipList: true,
		}	
	});
	return {
		subscribe,
		load: async () => {
			const uid = getUserUid();
			const docRef = doc(db, 'users', uid);
			const docSnapshot = await getDoc(docRef);
			const userSettings = docSnapshot.data() as UserSettings;
			set(userSettings);
			return userSettings; 

			// unsubscribe = onSnapshot(docRef, (doc) => {
			// 	set(doc.data() as UserSettings);
			// });
		},
		save: async (settings: UserSettings) => {
			const uid = getUserUid();
			await setDoc(doc(db, 'users', uid),	settings);
		},
		sendToken: async () => {
			const messaging = getMessaging(app);
			const currentToken = await getToken(messaging, firebaseMessagingConfig);
			if (currentToken) {
				const userUid = getUserUid();
				await setDoc(
					doc(db, `users/${userUid}/device_tokens`, currentToken),
					{ token: currentToken, created: new Date() },
					{ merge: true }
				);
			} else {
				alert('No registration token available. Request permission to generate one.');
			}
		},
		deleteToken: async () => {
			const messaging = getMessaging(app);
			const userUid = getUserUid();
			const currentToken = await getToken(messaging, firebaseMessagingConfig);
			if (currentToken) {
				await deleteDoc(doc(db, `users/${userUid}/device_tokens`, currentToken));
			}
		},
		deleteAccount: async () => {
			await deleteUser(auth.currentUser!);
			},
		destroy: () => {
			unsubscribe();
		}
	};
}
