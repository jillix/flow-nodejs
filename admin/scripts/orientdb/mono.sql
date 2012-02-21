drop database remote:localhost/mono root @ORIENTDB_ROOT_PASSWORD@;
create database remote:localhost/mono root @ORIENTDB_ROOT_PASSWORD@ local;

import database /Users/gabriel/Work/jillix/admin/scripts/orientdb/schema.json;

create index moduleNames on VModule (name) unique;

import database /Users/gabriel/Work/jillix/admin/scripts/orientdb/records.json;

info;

