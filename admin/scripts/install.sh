#!/bin/bash

MONO_ROOT=`pwd`

# TODO temp module removal
rm -Rf $MONO_ROOT/modules/*

# install OrientDB and mono database
$MONO_ROOT/admin/scripts/orientdb/install.sh
if [ $? -gt 0 ]
then
    exit 1
fi

# configure mono
node $MONO_ROOT/admin/scripts/installation/init_core_apps.js

