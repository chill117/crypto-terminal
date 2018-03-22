describe('paymentMethods.monero', function() {

	describe('parseExtraField(extra)', function() {

		it('should exist', function() {
			expect(app.paymentMethods.monero.parseExtraField).to.be.a('function');
		});

		it('should parse the extra field', function() {
			var fixtures = [
				{
					extra: '0157d4239bb37b464921f4c9d6d3ef9cda7f197071d855af400d2fcc35075456b7020901fb1169f304b29ada',
					parsed: {
						paymentId: 'fb1169f304b29ada',
						publicKey: '57d4239bb37b464921f4c9d6d3ef9cda7f197071d855af400d2fcc35075456b7',
					},
				},
				{
					extra: '01ba97c246713100c7b5e7a486b67b9aa3eb05b4df75a3d0d956324719962e5bc9',
					parsed: {
						paymentId: null,
						publicKey: 'ba97c246713100c7b5e7a486b67b9aa3eb05b4df75a3d0d956324719962e5bc9',
					},
				},
				{
					extra: '0221005533c323c58b197d9f7b3ec568426e199b4f5498c451eac43515eb0c766ab71b0149f76536fa1fbb8c82dbe031dc0ecef05902a9bfe6bce1c62ce9f00739055e54',
					parsed: {
						paymentId: '5533c323c58b197d9f7b3ec568426e199b4f5498c451eac43515eb0c766ab71b',
						publicKey: '49f76536fa1fbb8c82dbe031dc0ecef05902a9bfe6bce1c62ce9f00739055e54',
					},
				},

			];
			_.each(fixtures, function(fixture) {
				var parsed = app.paymentMethods.monero.parseExtraField(fixture.extra);
				expect(parsed).to.deep.equal(fixture.parsed);
			});
		});
	});
});
