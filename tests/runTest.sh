#!/bin/bash

cd "$(dirname $0)";

rm -r dist;
gulp;
npx asar e dist/test.asar dist;

FAILED=0;

# Check files
( cd src && find . -type f ) | while read LINE; do

	MD5_SRC="$(cd src && md5sum "${LINE}")";
	MD5_DIST="$(cd dist && md5sum "${LINE}")";

	if [ "e$MD5_SRC" == "e$MD5_DIST" ]; then
		echo "CONTENT   PASS: $LINE";
	else
		echo "CONTENT   FAIL: $LINE";
		FAILED=1;
	fi

	if ([ -x "./src/$LINE" ] && [ -x "./dist/$LINE" ]) || (! [ -x "./src/$LINE" ] && ! [ -x "./dist/$LINE" ]); then
		echo "EXECUTE   PASS: $LINE";
	else
		echo "EXECUTE   FAIL: $LINE";
		FAILED=1;
	fi

done

# Check folders
( cd src && find . -type d ) | while read LINE; do

	if [ -d "./dist/$LINE" ]; then
		echo "DIRECTORY PASS: $LINE";
		FAILED=1;
	else
		echo "DIRECTORY FAIL: $LINE";
	fi

done

exit $FAILED;
