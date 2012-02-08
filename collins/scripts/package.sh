#! /usr/bin/env sh

if [ -z "$PLAY_CMD" ]; then
  PLAY_CMD="$HOME/src/Play20/play";
fi

$PLAY_CMD clean compile stage
cd target

mkdir collins
mkdir collins/scripts
mkdir collins/conf
mv staged collins/lib
cp ../scripts/collins.sh collins/scripts/collins.sh
cp ../conf/logger.xml collins/conf/
cp ../conf/production.conf collins/conf/
cp -R ../db collins/scripts/
zip -r collins.zip collins