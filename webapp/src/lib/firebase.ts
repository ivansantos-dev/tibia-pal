import { initializeApp } from 'firebase/app';
import {
	doc,
	setDoc,
	getFirestore,
	collection,
	getDocs,
	Timestamp,
	deleteDoc
} from 'firebase/firestore/lite';
import { NameState } from './tibia_client';
import {
	type User,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	getAuth,
	signOut
} from 'firebase/auth';
import { writable } from 'svelte/store';

const firebaseConfig = {
	apiKey: 'AIzaSyA7Zj56RE-zq3NuVU1QeZuXP8_RPFxlNRY',
	authDomain: 'tibia-1fcfa.firebaseapp.com',
	projectId: 'tibia-1fcfa',
	storageBucket: 'tibia-1fcfa.appspot.com',
	messagingSenderId: '244551684591',
	appId: '1:244551684591:web:ec0b7e554422245ff7a61a'
};

export const userStore: any = writable(null);

export const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
	console.log('onAuthStateChanged', user);
	if (user) {
		userStore.set(user);
	} else {
		userStore.set(null);
	}
});

// Get a list of cities from your database
export async function getExpiringNames(): Promise<{}> {
	const collections = collection(db, 'expiring_names');
	const docs = await getDocs(collections);
	const formerNames = docs.docs.map((doc) => doc.data());

	return formerNames;
}

export async function addExpiringName(name: string) {
	const now = new Date().getTime();
	await setDoc(doc(db, 'expiring_names', name), {
		name,
		status: NameState[NameState.expiring],
		nextCheck: new Date(now + 1 * 60 * 60 * 1000)
	});
}

export async function deleteExpiringName(name: string) {
	await deleteDoc(doc(db, 'expiring_name', name));
}

export async function login(email: string, password: string) {
	await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
	await signOut(auth);
}
