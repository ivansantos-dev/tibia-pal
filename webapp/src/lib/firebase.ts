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

const firebaseConfig = {
	apiKey: 'AIzaSyA7Zj56RE-zq3NuVU1QeZuXP8_RPFxlNRY',
	authDomain: 'tibia-1fcfa.firebaseapp.com',
	projectId: 'tibia-1fcfa',
	storageBucket: 'tibia-1fcfa.appspot.com',
	messagingSenderId: '244551684591',
	appId: '1:244551684591:web:ec0b7e554422245ff7a61a'
};


type ExpiringName = {
	name: string,
	status: "expiring" | "available"
	nextCheck: Timestamp,
	userUid: string,
}

export const userStore: Writable<User | null> = writable(null);
export const expiringNamesStore: Writable<ExpiringName[]> = writable([]);
let unsubscribeExpiringName: Unsubscribe = () => null 

export const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
	userStore.set(user);
});

export async function loadExpiringNames() {
	const uid = auth.currentUser?.uid
	const collections = collection(db, 'expiring_names');
	const q = query(collections, where("userUid", "==", uid))
	const docs = await getDocs(q);
	const formerNames = docs.docs.map((doc) => doc.data() as ExpiringName);
	expiringNamesStore.set(formerNames)
	unsubscribeExpiringName = onSnapshot(q, (querySnapshot: QuerySnapshot) => {
		const names = []
		querySnapshot.forEach((doc: DocumentSnapshot) => {
			names.push(doc.data() as ExpiringName)
			}
		);
	});
}

export async function addExpiringName(name: string) {
	const uid = get(userStore)?.uid 
	const now = new Date().getTime();
	await setDoc(doc(db, 'expiring_names', name), {
		name,
		status: NameState[NameState.expiring],
		nextCheck: new Date(now + 1 * 60 * 60 * 1000),
		userUid: uid,
	});
}

export async function deleteExpiringName(name: string) {
	await deleteDoc(doc(db, 'expiring_names', name));
}


export async function loadProfile() {
	const uid = get(userStore)?.uid 
	const docSnapshot = await getDoc(doc(db, 'users', uid))
	return docSnapshot.data()
}

export async function unsubscribeAll() {
	unsubscribeExpiringName()
}

export async function saveNotificationEmails(emails: string) {
	const uid = get(userStore)?.uid 
	await setDoc(doc(db, 'users', uid), {
		userUid: uid,
		notificationEmails: emails,
	});
	
}


export async function login(email: string, password: string) {
	await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
	await signOut(auth);
}
