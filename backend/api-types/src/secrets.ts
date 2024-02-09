export interface SecretValueSpecification {
	_type: 'secret.value.specification';
	secretValue: string;
	uniqueSecretName: string;
	secretDescription: string;
}

export function secretValueSpecification(secretValue: string, uniqueSecretName: string, secretDescription: string): SecretValueSpecification {
	return {
		_type: 'secret.value.specification',
		secretValue,
		uniqueSecretName,
		secretDescription
	};
}
