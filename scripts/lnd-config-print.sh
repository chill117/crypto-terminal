#!/bin/bash

# qr is required - https://github.com/fukuchi/libqrencode
command -v qr &> /dev/null || { echo "Missing required program: qr"; exit 1; }
# jq is required - https://stedolan.github.io/jq/
command -v jq &> /dev/null || { echo "Missing required program: jq"; exit 1; }

# abort on errors
set -e

# !!! TODO !!! make these configurable
LNDDIR="~/.lnd"
CHAIN="bitcoin"
NETWORK="mainnet"

# prints as text and encodes as QR code in the terminal
# !!! TODO !!! make configurable (output to text OR qr code)
generateOutput() {
	echo "$1"
	echo "$1" | qr --error-correction=L
}

echo "Which information do you want to print?"
# !!! TODO !!! lndconnect URI
# https://github.com/LN-Zap/lndconnect/blob/master/lnd_connect_uri.md
echo "[1] Node connection string (e.g \"PUBKEY@HOST:PORT\")"
echo "[2] Invoice Macaroon"
echo "[3] TLS Certificate"
read INFO_TYPE
case $INFO_TYPE in
	1)
		CONNECTION_STRING="$(lncli getinfo | jq '.uris[0]')"
		generateOutput "$CONNECTION_STRING"
	;;
	2)
		INVOICE_MACAROON_FILEPATH="$LNDDIR/data/chain/$CHAIN/$NETWORK/invoice.macaroon"
		if [ ! -f "$INVOICE_MACAROON_FILEPATH" ]; then
			echo "ERROR: Invoice macaroon file not found"
			echo "$INVOICE_MACAROON_FILEPATH"
			exit 1
		fi
		INVOICE_MACAROON="$(xxd -p -c 1000 $INVOICE_MACAROON_FILEPATH | xargs)"
		generateOutput "$INVOICE_MACAROON"
	;;
	3)
		TLS_CERT="$(cat $LNDDIR/tls.cert | base64)"
		generateOutput "$TLS_CERT"
	;;
	*)
		echo "ERROR: Invalid option"
		exit 1
	;;
esac
