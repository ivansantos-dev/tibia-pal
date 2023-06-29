export enum NameState {
	expiring,
	available,
	not_expiring,
	error
}

export async function isCharacterNameExpiring(name: string): Promise<NameState> {
	const response = await fetch(`https://api.tibiadata.com/v3/character/${name}`);
	const data = await response.json();

	if (!response.ok) {
		alert('failed to reach tibiadata');
		console.error(response);
		return NameState.error;
	}

	const apiName: string = data.characters.character.name.toLowerCase();
	if (apiName === '') {
		return NameState.available;
	}

	const lowerName = name.toLowerCase();
	console.log(lowerName);

	console.log('equality', lowerName === apiName);
	if (lowerName === apiName) {
		return NameState.not_expiring;
	}

	let formerNames: string[] = data.characters.character.former_names;
	formerNames = formerNames.map((formerName) => formerName.toLowerCase());

	if (formerNames.includes(name)) {
		return NameState.expiring;
	}

	return NameState.not_expiring;
}
