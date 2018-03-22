var app = app || {};

app.paymentMethods = app.paymentMethods || {};

app.paymentMethods.monero = (function() {

	'use strict';

	/*
		https://getmonero.org/get-started/what-is-monero/
	*/

	return app.abstracts.PaymentMethod.extend({

		enabled: true,

		// The name of the cryptocurrency shown in the UI:
		label: 'Monero',

		// The exchange symbol:
		code: 'XMR',

		// Used internally to reference itself:
		ref: 'monero',

		// Used when formatting numbers (to be displayed in the UI).
		numberFormat: {
			decimals: 12,
		},

		txsSubscriptionId: null,

		lang: {
			'en': {
				'settings.public-address.label': 'Public Address',
				'settings.private-view-key.label': 'Private View Key',
				'payment-request.public-address-required': 'Public address is required to generate a payment request',
				'invalid-checksum': 'Invalid checksum',
				'invalid-length': 'Invalid length',
				'invalid-network-byte': 'Invalid network byte',
				'invalid-secret.length': 'Invalid secret key length. Are you sure that you copied or typed the whole key?',
				'public-address-needed-to-check-private-view-key': 'Public Address is required to check the Private View Key',
				'private-view-key-public-address-mismatch': 'Incorrect Private View Key: Does not pair with the Public Address provided.',
			},
			'de': {
				'settings.public-address.label': 'Öffentliche Adresse',
				'settings.private-view-key.label': 'Private View Schlüssel',
				'payment-request.public-address-required': 'Die öffentliche Adresse wird benötigt, um eine Zahlungsanforderung zu generieren',
				'invalid-checksum': 'Ungültige Prüfsumme',
				'invalid-length': 'Ungültige Länge',
				'invalid-network-byte': 'Ungültiges Netzwerk Byte',
				'invalid-secret.length': 'Ungültige Länge des geheimen Schlüssels. Sind Sie sicher, dass Sie den gesamten Schlüssel kopiert bzw. eingegeben haben?',
				'public-address-needed-to-check-private-view-key': 'Die öffentliche Adresse ist erforderlich, um den privaten View Schlüssel zu überprüfen',
				'private-view-key-public-address-mismatch': 'Falscher privater View Schlüssel: Passt nicht mit der zur Verfügung gestellten öffentlichen Adresse zusammen.',
			},
			'cs': {
				'settings.public-address.label': 'Veřejná adresa',
				'settings.private-view-key.label': 'Klíč soukromého zobrazení',
				'payment-request.public-address-required': 'Pro generování žádosti o platbu je vyžadována veřejná adresa',
				'invalid-checksum': 'Neplatný kontrolní součet',
				'invalid-length': 'Neplatná délka',
				'invalid-network-byte': 'Neplatná síťová verze',
			},
			'es': {
				'settings.public-address.label': 'Direccion publica',
				'settings.private-view-key.label': 'Clave de vista privada',
				'payment-request.public-address-required': 'Se requiere una dirección pública para generar una solicitud de pago',
				'invalid-checksum': 'Suma de comprobación inválida',
				'invalid-length': 'Longitud inválida',
				'invalid-network-byte': 'La versión de la red no es válida',
			},
			'fr': {
				'settings.public-address.label': 'Adresse publique',
				'settings.private-view-key.label': 'Clé privée',
				'payment-request.public-address-required': 'L\'adresse publique est requise pour générer une demande de paiement',
				'invalid-checksum': 'Somme de contrôle invalide',
				'invalid-length': 'Longueur invalide',
				'invalid-network-byte': 'Octet réseau non valide',
			},
		},

		settings: [
			{
				name: 'publicAddress',
				label: function() {
					return app.i18n.t('monero.settings.public-address.label');
				},
				type: 'text',
				required: true,
				validate: function(value, data) {
					this.validatePublicAddress(value);
				},
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
				name: 'privateViewKey',
				label: function() {
					return app.i18n.t('monero.settings.private-view-key.label');
				},
				type: 'text',
				required: true,
				validate: function(value, data) {
					this.validatePrivateViewKey(value, data[this.ref + '.publicAddress']);
				},
				actions: [
					{
						name: 'camera',
						fn: function(value, cb) {
							app.device.scanQRCodeWithCamera(cb);
						}
					}
				]
			}
		],

		networks: [
			{
				name: 'mainnet',
				versions: {
					standard: 0x12,
					integrated: 0x13,
				},
			},
			{
				name: 'testnet',
				versions: {
					standard: 0x35,
					integrated: 0x13,
				},
			},
		],

		// Used to generate a payment request URI:
		uriScheme: 'monero',

		bs53: (function() {
			var alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
			return basex(alphabet);
		})(),

		KEY_SIZE: 32,
		STRUCT_SIZES: {
			GE_P3: 160,
		},

		getNetwork: function(version) {

			return _.find(this.networks, function(network) {
				return !!_.find(network.versions, function(_version) {
					return version === Buffer([_version]).toString('hex');
				});
			});
		},

		getNetworkName: function() {

			var publicAddress = app.settings.get(this.ref + '.publicAddress');
			var decoded = this.decodePublicAddress(publicAddress);
			return decoded.network.name;
		},

		validatePublicAddress: function(publicAddress) {

			this.decodePublicAddress(publicAddress);

			// If we got this far, it's valid.
			return true;
		},

		/*
			A monero address is as follows:
				1) (network byte) + (32-byte public spend key) + (32-byte public view key)
				2) keccak256((result from step 1))
				3) (result from step 1) + (first 4 bytes of the result from step 2)
				4) base58Encode(result from step 3)

			Sanity checks for the public address:
				* Has the correct length
				* Can base58 decode
				* Has a valid network byte
				* Checksum is correct (last four bytes from step 2 above)
				* Public view key in address pairs with private view key provided via settings.
		*/
		decodePublicAddress: function(publicAddress) {

			var hex = this.convertAddressToHex(publicAddress);
			var version = hex.substr(0, 2);
			var network = this.getNetwork(version);

			if (!network) {
				throw new Error(app.i18n.t(this.ref + '.invalid-network-byte'));
			}

			/*
				Integrated addresses:
				https://monero.stackexchange.com/questions/3179/what-is-an-integrated-address
			*/
			var isIntegrated = version === '13';
			var expectedLength = isIntegrated ? 154 : 138;

			if (hex.length !== expectedLength) {
				throw new Error(app.i18n.t(this.ref + '.invalid-length'));
			}

			var publicSpendKey = hex.substr(2, 64);
			var publicViewKey = hex.substr(66, 64);
			// Integrated addresses contain an 8-byte payment ID.
			var paymentId = isIntegrated ? hex.substr(130, 16) : '';
			var checksum = hex.substr(hex.length - 8, 8);
			var hash = keccak256(Buffer.from(version + publicSpendKey + publicViewKey + paymentId, 'hex'));

			if (hash.substr(0, 8) !== checksum) {
				throw new Error(app.i18n.t(this.ref + '.invalid-checksum'));
			}

			return {
				network: network,
				publicSpendKey: publicSpendKey,
				publicViewKey: publicViewKey,
				paymentId: paymentId || null,
			};
		},

		/*
			Monero addresses are base58 encoded in blocks instead of all at once.

			See:
			https://monero.stackexchange.com/questions/6049/why-monero-address-is-converted-to-base-58-in-blocks-instead-of-all-at-once
		*/
		convertAddressToHex: function(address) {

			var hex = '';
			var fullEncodedBlockSize = 11;
			var encodedBlockSizes = [0, 2, 3, 5, 6, 7, 9, 10, 11];
			var fullBlockCount = Math.floor(address.length / fullEncodedBlockSize);
			var lastBlockSize = address.length % fullEncodedBlockSize;
			var lastBlockDecodedSize = encodedBlockSizes.indexOf(lastBlockSize);
			if (lastBlockDecodedSize < 0) {
				throw new Error(app.i18n.t(this.ref + '.invalid-length'));
			}
			var block;
			for (var index = 0; index < fullBlockCount; index++) {
				block = address.substr(index * fullEncodedBlockSize, fullEncodedBlockSize);
				hex += this.decodeBlock(block);
			}
			if (lastBlockSize > 0) {
				block = address.substr(fullBlockCount * fullEncodedBlockSize, lastBlockSize);
				hex += this.decodeBlock(block);
			}
			return hex;
		},

		decodeBlock: function(block) {
			var decoded = this.bs53.decode(block).toString('hex');
			// Remove excess leading zeros.
			decoded = decoded.replace(/^0{2,}/, '0');
			return decoded;
		},

		validatePrivateViewKey: function(privateViewKey, publicAddress) {

			if (!publicAddress) {
				throw new Error(app.i18n.t(this.ref + '.public-address-needed-to-check-private-view-key'));
			}

			var decoded = this.decodePublicAddress(publicAddress);
			var publicViewKey = this.secretKeyToPublicKey(privateViewKey);

			if (publicViewKey !== decoded.publicViewKey) {
				throw new Error(app.i18n.t(this.ref + '.private-view-key-public-address-mismatch'));
			}
		},

		secretKeyToPublicKey: function(secretKey) {

			var input = Buffer.from(secretKey, 'hex');

			if (input.length !== 32) {
				throw new Error(app.i18n.t(this.ref + '.invalid-secret.length'));
			}

			var Module = MoneroCrypto;
			var KEY_SIZE = this.KEY_SIZE;
			var STRUCT_SIZES = this.STRUCT_SIZES;
			var input_mem = Module._malloc(KEY_SIZE);
			Module.HEAPU8.set(input, input_mem);
			var ge_p3 = Module._malloc(STRUCT_SIZES.GE_P3);
			var out_mem = Module._malloc(KEY_SIZE);
			Module.ccall('ge_scalarmult_base', 'void', ['number', 'number'], [ge_p3, input_mem]);
			Module.ccall('ge_p3_tobytes', 'void', ['number', 'number'], [out_mem, ge_p3]);
			var output = Module.HEAPU8.subarray(out_mem, out_mem + KEY_SIZE);
			Module._free(ge_p3);
			Module._free(input_mem);
			Module._free(out_mem);
			return Buffer.from(output).toString('hex');
		},

		generatePaymentRequest: function(amount, cb) {

			_.defer(_.bind(function() {

				try {

					var address = app.settings.get(this.ref + '.publicAddress');

					if (!address) {
						throw new Error(app.i18n.t(this.ref + '.payment-request.public-address-required'));
					}

					var decoded = this.decodePublicAddress(address);
					// Use 32 byte payment IDs until we can properly decrypt payment IDs in transactions.
					var paymentId = decoded.paymentId || this.generatePaymentId(32);

					var uri = this.uriScheme + ':' + address + '?' + querystring.stringify({
						tx_payment_id: paymentId,
						tx_amount: amount
					});

					var paymentRequest = {
						amount: amount,
						uri: uri,
						data: {
							address: address,
							paymentId: paymentId,
						},
					};

				} catch (error) {
					return cb(error);
				}

				cb(null, paymentRequest);

			}, this));
		},

		/*
			To uniquely identify each payment request, we need a payment ID.

			See:
			https://getmonero.org/resources/moneropedia/paymentid.html
		*/
		generatePaymentId: function(length) {

			var randomString = app.util.generateRandomString(length);
			var paymentId = '';
			for (var index = 0; index < randomString.length; index++ ) {
				paymentId += randomString.charCodeAt(index).toString(16);
			}
			return paymentId;
		},

		blockExplorerHostNames: {
			mainnet: 'xmrchain.com',
			testnet: 'testnet.xmrchain.com',
		},

		getBlockExplorerUrl: function(uri) {

			var networkName = this.getNetworkName();
			var hostname = this.blockExplorerHostNames[networkName];
			return 'https://' + hostname + uri;
		},

		/*
			Checks the outputs of the transaction using our private view key.
		*/
		checkTransaction: function(tx, cb) {

			var networkName = this.getNetworkName();

			var txObject = {
				txhash: tx.tx_hash,
				address: app.settings.get(this.ref + '.publicAddress'),
				viewkey: app.settings.get(this.ref + '.privateViewKey'),
				txprove: 0,
			}

			app.services.ctApi.getMoneroOutputs(networkName, txObject, function(error, result) {
				if (error) {
					return cb(error);
				}

				var outputs = result && result.data && result.data.outputs || [];
				outputs = _.filter(outputs, function(output) {
					return output.match === true;
				});
				cb(null, outputs);
			});
		},

		checkRemainingTransactions: function(txs, cb) {

			// Check the remaining transactions.
			async.map(txs, _.bind(function(tx, nextTx) {
				this.checkTransaction(tx, function(error, outputs) {
					if (error) {
						app.log(error);
					}
					if (outputs) {
						tx.outputs = outputs;
					}
					nextTx(null, tx);
				});
			}, this), function(error, txs) {

				if (error) {
					app.log(error);
					return cb(error);
				}

				cb(null, txs);
			});
		},

		listenForPayment: function(paymentRequest, cb) {

			var networkName = this.getNetworkName();
			var amount = paymentRequest.amount;
			var rate = paymentRequest.rate;
			var decimals = this.numberFormat.decimals;
			var cryptoAmount = app.models.PaymentRequest.prototype.convertToCryptoAmount(amount, rate, decimals);
			var paymentId = paymentRequest.data.paymentId;
			var channel = 'get-monero-transactions?' + querystring.stringify({
				networkName: networkName
			});
			var stopListeningForPayment = _.bind(this.stopListeningForPayment, this);
			var checkRemainingTransactions = _.bind(this.checkRemainingTransactions, this);

			var done = _.once(function() {
				stopListeningForPayment();
				cb.apply(undefined, arguments);
			});

			var listener = _.bind(function(txs) {

				// Filter out transactions that don't have the correct payment ID.
				txs = _.filter(txs, function(tx) {
					return !!tx.payment_id && tx.payment_id === paymentId;
				});

				checkRemainingTransactions(txs, function(error, txsRemaining) {

					if (error) {
						return done(error);
					}

					try {
						var amountReceived = (new BigNumber('0'))
						_.each(txsRemaining, function(tx) {
							_.each(tx.outputs, function(output) {
								amountReceived = amountReceived.plus(output.amount);
							});
						});
						amountReceived = amountReceived.times('10e-12');
					} catch (error) {
						return done(error);
					}

					if (amountReceived.isGreaterThanOrEqualTo(cryptoAmount)) {
						// Passing transaction data so that it can be stored.
						var txData = _.chain(txs).first().pick('tx_hash').value();
						return done(null, txData);
					}

					// Continue listening..

				});

			}, this);

			app.services.ctApi.subscribe(channel, listener);
			this.listening = { channel: channel, listener: listener };
		},

		stopListeningForPayment: function() {

			if (this.listening) {
				var channel = this.listening.channel;
				var listener = this.listening.listener;
				app.services.ctApi.unsubscribe(channel, listener);
				this.listening = null;
			}
		},

		/*
	this.generate_key_derivation = function(pub, sec) {
	    if (pub.length !== 64 || sec.length !== 64) {
	        throw "Invalid input length";
	    }
	    var pub_b = hextobin(pub);
	    var sec_b = hextobin(sec);
	    var pub_m = Module._malloc(KEY_SIZE);
	    Module.HEAPU8.set(pub_b, pub_m);
	    var sec_m = Module._malloc(KEY_SIZE);
	    Module.HEAPU8.set(sec_b, sec_m);
	    var ge_p3_m = Module._malloc(STRUCT_SIZES.GE_P3);
	    var ge_p2_m = Module._malloc(STRUCT_SIZES.GE_P2);
	    var ge_p1p1_m = Module._malloc(STRUCT_SIZES.GE_P1P1);
	    if (Module.ccall("ge_frombytes_vartime", "bool", ["number", "number"], [ge_p3_m, pub_m]) !== 0) {
	        throw "ge_frombytes_vartime returned non-zero error code";
	    }
	    Module.ccall("ge_scalarmult", "void", ["number", "number", "number"], [ge_p2_m, sec_m, ge_p3_m]);
	    Module.ccall("ge_mul8", "void", ["number", "number"], [ge_p1p1_m, ge_p2_m]);
	    Module.ccall("ge_p1p1_to_p2", "void", ["number", "number"], [ge_p2_m, ge_p1p1_m]);
	    var derivation_m = Module._malloc(KEY_SIZE);
	    Module.ccall("ge_tobytes", "void", ["number", "number"], [derivation_m, ge_p2_m]);
	    var res = Module.HEAPU8.subarray(derivation_m, derivation_m + KEY_SIZE);
	    Module._free(pub_m);
	    Module._free(sec_m);
	    Module._free(ge_p3_m);
	    Module._free(ge_p2_m);
	    Module._free(ge_p1p1_m);
	    Module._free(derivation_m);
	    return bintohex(res);
	};
		*/
		decryptPaymentId: function(encryptedPaymentId, txPublicKey) {

			var privateViewKey = app.settings.get(this.ref + '.privateViewKey');
			var decryptionKey = keccak256(
				Buffer.from(
					BigInteger.fromHex(txPublicKey)
						.multiply(BigInteger.fromHex(privateViewKey))
						.multiply(BigInteger.fromHex('08'))
						.toBuffer()
				).toString('hex') + '8d'
			);
			return this.xor(encryptedPaymentId, decryptionKey);
		},

		// Buffer.from((new elliptic.eddsa('ed25519')).keyFromSecret(app.settings.get('monero.privateViewKey')).getPublic()).toString('hex')

		/*
        var input = hextobin(sec);
        if (input.length !== 32) {
            throw "Invalid input length";
        }
        var input_mem = Module._malloc(KEY_SIZE);
        Module.HEAPU8.set(input, input_mem);
        var ge_p3 = Module._malloc(STRUCT_SIZES.GE_P3);
        var out_mem = Module._malloc(KEY_SIZE);
        Module.ccall('ge_scalarmult_base', 'void', ['number', 'number'], [ge_p3, input_mem]);
        Module.ccall('ge_p3_tobytes', 'void', ['number', 'number'], [out_mem, ge_p3]);
        var output = Module.HEAPU8.subarray(out_mem, out_mem + KEY_SIZE);
        Module._free(ge_p3);
        Module._free(input_mem);
        Module._free(out_mem);
        return bintohex(output);
		*/

		// var decryptedId = hex_xor(extra.paymentId, cn_fast_hash(der + "8d").slice(0,16));
		/*
		function(hex1, hex2) {
		    if (!hex1 || !hex2 || hex1.length !== hex2.length || hex1.length % 2 !== 0 || hex2.length % 2 !== 0){throw "Hex string(s) is/are invalid!";}
		    var bin1 = hextobin(hex1);
		    var bin2 = hextobin(hex2);
		    var xor = new Uint8Array(bin1.length);
		    for (i = 0; i < xor.length; i++){
		        xor[i] = bin1[i] ^ bin2[i];
		    }
		    return bintohex(xor);
		};
		*/

		xor: function(hex1, hex2) {
			var a = Buffer.from(hex1, 'hex');
			var b = Buffer.from(hex2.substr(0, hex1.length), 'hex');
			var result = [];
			for (var index = 0; index < a.length; index++) {
				result.push(a[index] ^ b[index]);
			}
			return Buffer.from(result).toString('hex');
		},

		/*
			See:
			https://cryptonote.org/cns/cns005.txt
		*/
		parseExtraField: function(extra) {

			var publicKey, paymentId, nonceLength, nonceType;
			var tag = extra.substr(0, 2);

			switch (tag) {

				case '00':
					// Just padding.
					break;

				case '01':
					// The next 32 bytes is the transaction public key.
					publicKey = extra.substr(2, 64);
					nonceType = extra.substr(70, 2);
					// Might also contain the payment ID.
					if (
						extra.substr(66, 2) === '02' &&
						(nonceType === '00' || nonceType === '01')
					) {
						/*
							Nonce types:
							0 = 32 byte unencrypted payment id
							1 = 8 byte encrypted payment id
						*/
						nonceLength = nonceType === '00' ? 64 : 16;
						paymentId = extra.substr(72, nonceLength);
					}
					break;

				case '02':
					nonceType = extra.substr(4, 2);
					if (nonceType === '00' || nonceType === '01') {
						/*
							Nonce types:
							0 = 32 byte unencrypted payment id
							1 = 8 byte encrypted payment id
						*/
						nonceLength = nonceType === '00' ? 64 : 16;
						paymentId = extra.substr(6, nonceLength);
					} else {
						nonceLength = 0;
					}
					var offset = 6 + nonceLength;
					if (extra.substr(offset, 2) === '01') {
						publicKey = extra.substr(offset + 2, 64);
					}
					break;
			}

			return {
				paymentId: paymentId || null,
				publicKey: publicKey || null,
			};
		},

	});
})();
