var app = app || {};

app.paymentMethods = app.paymentMethods || {};

app.paymentMethods.ethereum = (function() {

	'use strict';

	return app.abstracts.PaymentMethod.extend({

		enabled: true,

		// The name of the cryptocurrency shown in the UI:
		label: 'Ethereum',

		// The exchange symbol:
		code: 'ETH',

		// Used internally to reference itself:
		ref: 'ethereum',

		// Used to generate a payment request URI:
		uriScheme: 'ethereum',

		// Used when formatting numbers (to be displayed in the UI).
		numberFormat: {
			decimals: 8,
		},

		lang: {
			'en': {
				'settings.account.label': 'Account',
				'settings.geth.websockets.host.label': 'Geth WebSockets Host',
				'settings.geth.websockets.host.description': ' (e.g "geth.example.com:8546")',
			},
		},

		settings: [
			{
				name: 'account',
				label: function() {
					return app.i18n.t('ethereum.settings.account.label');
				},
				type: 'text',
				required: true,
				actions: [
					{
						name: 'camera',
						fn: function(value, cb) {
							app.device.scanQRCodeWithCamera(cb);
						}
					}
				]
			},
			{
				name: 'geth.websockets.host',
				label: function() {
					return app.i18n.t('ethereum.settings.geth.websockets.host.label');
				},
				description: function() {
					return app.i18n.t('ethereum.settings.geth.websockets.host.description');
				},
				type: 'text',
				required: true,
			},
		],

		web3: {},

		generatePaymentRequest: function(amount, cb) {

			_.defer(_.bind(function() {

				try {
					var account = app.settings.get(this.ref + '.account');
					var value = (new BigNumber(amount)).toExponential();
					var uri = this.uriScheme + ':' + account + '?' + querystring.stringify({
						value: value,
					});
					var paymentRequest = {
						amount: amount,
						uri: uri,
						data: {
							account: account,
						},
					};
				} catch (error) {
					return cb(error);
				}

				cb(null, paymentRequest);

			}, this));
		},

		listenForPayment: function(paymentRequest, cb) {

			var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://' + app.settings.get(this.ref + '.geth.websockets.host')));
			this.web3.subscription = web3.eth.subscribe('pendingTransactions', function() {
				console.log(arguments);
			}).on('data', function(tx) {
				console.log(tx);
			});
		},

		stopListeningForPayment: function() {

			if (this.web3 && this.web3.subscription) {
				this.web3.subscription.unsubscribe(function() {
					console.log(arguments);
				});
			}
		},

	});

})();
