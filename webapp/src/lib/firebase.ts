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


type ExpiringName = {
	id: string,
	name: string,
	status: string, 
	nextCheck: Timestamp,
	userUid: string,
}

type Friend = {
	id: string,
	name: string,
	world: string,
	status: "online" | "offline",
	userUid: string,
}

export const userStore: Writable<User | null> = writable(null);
export const expiringNamesStore = createExpiringNameStore();
export const friendListStore = createFriendListStore();
export const profileStore = createProfileStore();


export const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
	userStore.set(user);
});

if (browser) {
	const messaging = getMessaging();
	getToken(messaging, { vapidKey: 'BLoJY3mZOwweR3KemCGlgFArwTfGh2PUzV2ssE_JSxUlQlUyeEZQN3PqoyjbQUvxz_pE1NwiBGm2bqBozld_5mo' })
		.then((currentToken) => {
	  if (currentToken) {
				console.log(currentToken)
	  } else {
	    console.log('No registration token available. Request permission to generate one.');
	  }
	}).catch((err) => {
	  console.log('An error occurred while retrieving token. ', err);
	});
	onMessage(messaging, (payload) => {
		console.log('Message received. ', payload);
	});
}



function createFriendListStore() {
	let unsubscribe: Unsubscribe = () => null
	const {subscribe, set } = writable<Friend[]>([]);

	return {
		subscribe,
		add: async (name: string, world: string) =>  {
			const uid = get(userStore)?.uid 
			await addDoc(collection(db, 'friends'), {
				name,
				status: "offline",
				world,
				userUid: uid,
			});
				},
		delete: async(id: string) => {
			await deleteDoc(doc(db, 'friends', id));
		
		},
		load: async () => {
			const uid = auth.currentUser?.uid
			const collections = collection(db, 'friends');

			const q = query(collections, where("userUid", "==", uid))
			const docs = await getDocs(q);
			const names = docs.docs.map((doc) => { 
				return 	{id: doc.id, ...doc.data()} as Friend
			});
			set(names)

			unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot) => {
				const names: Friend[] = []
				querySnapshot.forEach((doc: DocumentSnapshot) => {
					names.push({id: doc.id, ...doc.data()} as Friend)
					}
				);
				set(names)
			});
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
		save: async (enableNotificationEmail: boolean, notificationEmails: string[]) => {
			const uid = get(userStore)!.uid 
			await setDoc(doc(db, 'users', uid), {
				enableNotificationEmail,
				notificationEmails,
			});
		},
		destroy: () => unsubscribe()
	}

}

export async function login(email: string, password: string) {
	await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
	await signOut(auth);
}
