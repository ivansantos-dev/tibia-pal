export enum NameState {
	expiring,
	available,
	not_found,
	error
}

export type TibiaApiCharacter = {
	name: string;
	formerNames: string[];
	world: string;
	expiring: boolean;
	nameState: NameState;
};

export async function getCharacterFromTibia(name: string): Promise<TibiaApiCharacter> {
	const response = await fetch(`https://api.tibiadata.com/v3/character/${name}`);
	const data = await response.json();

	let nameState = NameState.not_found;
	if (!response.ok) {
		alert('failed to reach tibiadata');
		nameState = NameState.error;
	}

	const apiName: string = data.characters.character.name;
	if (apiName === '') {
		nameState = NameState.available;
	}

	const lowerName = name.toLowerCase();
	if (lowerName === apiName.toLowerCase()) {
		nameState = NameState.not_found;
	}

	let formerNames: string[] = [];
	const apiFormerName: string[] = data.characters.character.former_names;
	if (apiFormerName != undefined) {
		formerNames = apiFormerName.map((name: string) => name.toLowerCase());
		if (formerNames.includes(lowerName)) {
			nameState = NameState.expiring;
		}
	}

	return {
		name: data.characters.character.name,
		formerNames: data.characters.character.formerNames,
		world: data.characters.character.world,
		expiring: nameState === NameState.expiring,
		nameState: nameState
	};
}
