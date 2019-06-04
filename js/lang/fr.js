var app = app || {};

app.lang = app.lang || {};

app.lang['fr'] = (function () {

	return {
		'self.label': 'Français',
		'admin.general-settings.label': 'Paramètres généraux',
		'admin.payment-history.label': 'Historique des paiements',
		'admin.pin.label': 'PIN d\'administrateur',
		'admin.pin.description': 'Restreint l\'accès à l\'espace d\'administration',
		'admin.pin.set-pin.title': 'Choisir un PIN',
		'admin.pin.change-pin.title': 'Changer de PIN',
		'admin.pin.set': 'Choisir',
		'admin.pin.change': 'Changer',
		'admin.pin.remove': 'Supprimer',
		'admin.pin.min-length': 'Le PIN doit consister d\'au moins {{minLength}} chiffre(s)',
		'settings.display-currency.label': 'Devise d\'affichage',
		'settings.date-format.label': 'Format de date ',
		'settings.accept-crypto-currencies.label': 'Quelle(s) monnaie(s) souhaitez-vous accepter ?',
		'settings.field-required': '{{label}} est requis(e)',
		'pay-enter-amount.description': 'Entrez le montant à payer',
		'pay-enter-amount.continue': 'Continuer',
		'pay-enter-amount.valid-number': 'Le montant doit être un nombre valide',
		'pay-enter-amount.greater-than-zero': 'Le montant doit être supérieur à zéro.',
		'pay-choose-method.description': 'Choisissez votre méthode de paiement',
		'pay-choose-method.cancel': 'Annuler',
		'pay-address.description': 'Scanner le code QR',
		'pay-address.cancel': 'Annuler',
		'pay-address.back': 'Retourner',
		'payment.status.pending': 'En attendant',
		'payment.status.canceled': 'Annulé',
		'payment.status.unconfirmed': 'Accepté',
		'payment.status.confirmed': 'Confirmé',
		'payment.status.timed-out': 'Fin du temps',
		'payment-history.failed-to-get-payment-data': 'Échec du téléchargement des données de paiement',
		'payment-history.empty': 'Aucun paiement pour le moment',
		'payment-details.title': 'Détails du paiement',
		'payment-details.label.status': 'Statut',
		'payment-details.label.timestamp': 'Date',
		'payment-details.label.amount': 'Montant',
		'payment-details.back': 'Retourner',
		'payment-request.data.invalid': '"data" est invalide',
		'payment-request.status.invalid': '"status" est invalide',
		'payment-status.unconfirmed.message': 'Merci !',
		'payment-status.unconfirmed.done': 'Effectué',
		'payment-status.timed-out.message': 'Fin du temps',
		'payment-status.timed-out.done': 'OK',
		'enter-pin.cancel': 'Annuler',
		'enter-pin.submit': 'Entrer',
		'pin-required.title': 'PIN Requis',
		'pin-required.instructions': 'Entrez le PIN d\'administrateur pour continuer',
		'pin-required.incorrect': 'Le PIN entré est incorrect',
		'device.camera.not-available': 'L\'appareil photo de l\'appareil  n\'est pas disponible',
		'more-menu.about': 'À propos de l\'application',
	};
})();
