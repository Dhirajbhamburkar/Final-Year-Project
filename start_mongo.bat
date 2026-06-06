@echo off
title SMADS - MongoDB
echo Starting MongoDB on port 27017...
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath C:\data\db --port 27017
