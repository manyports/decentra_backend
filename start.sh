#!/bin/bash

pkill -f mediamtx

sleep 1

cd mediamtx && ./mediamtx &

sleep 2

node start.js 