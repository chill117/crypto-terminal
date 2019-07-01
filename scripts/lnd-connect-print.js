var fs = require('fs');
var path = require('path');
var lndconnect = require('lndconnect');

var lndDirPath = path.join(__dirname, '.lnd');
var chain = 'bitcoin';
var network = 'mainnet';

var cert = (function() {
	var filePath = path.join(lndDirPath, 'tls.cert');
	return fs.readFileSync(filePath, 'utf8');
})();

var macaroon = (function() {
	var filePath = path.join(lndDirPath, 'data', 'chain', chain, network, 'admin.macaroon');
	return fs.readFileSync(filePath, 'hex');
})();

var host = '127.0.0.1:10009';

var connectionString = lndconnect.encode({
  host: host,// ip-address:port
  cert: cert,// just base64
  macaroon: macaroon,// hex
});

console.log(connectionString);
