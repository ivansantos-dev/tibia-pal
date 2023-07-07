
export function docStore<T>(
  firestore: Firestore,
  ref: string | DocumentReference,
  startWith?: T
) {
  let unsubscribe: () => void;

  // Fallback for SSR
  if (!firestore || !globalThis.window) {
    console.warn('Firestore is not initialized or not in browser');
    const { subscribe } = writable(startWith);
    return {
      subscribe,
      ref: null,
      id: '',
    }
  }

  const docRef = typeof ref === 'string' ? doc(firestore, ref) : ref;

  const { subscribe } = writable<T | null>(startWith, (set) => {
    unsubscribe = onSnapshot(docRef, (snapshot) => {
      set((snapshot.data() as T) ?? null);
    });

    return () => unsubscribe();
  });

  return {
    subscribe,
    ref: docRef,
    id: docRef.id,
  };
}

export function collectionStore<T>(
  firestore: Firestore,
  ref: string | Query | CollectionReference,
  startWith: T[] = []
) {
  let unsubscribe: () => void;

  // Fallback for SSR
  if (!firestore || !globalThis.window) {
    console.warn('Firestore is not initialized or not in browser');
    const { subscribe } = writable(startWith);
    return {
      subscribe,
      ref: null,
    }
  }

  const colRef = typeof ref === 'string' ? collection(firestore, ref) : ref;

  const { subscribe } = writable(startWith, (set) => {
    unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map((s) => {
        return { id: s.id, ref: s.ref, ...s.data() } as T;
      });
      set(data);
    });

    return () => unsubscribe();
  });

  return {
    subscribe,
    ref: colRef,
  };
}
