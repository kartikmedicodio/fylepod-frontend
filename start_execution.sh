#!/bin/bash

export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)"
# Define paths as variables
PROJECT_DIR="/home/RelayzenAdmin/relayzen_frontend"
DIST_DIR="$PROJECT_DIR/dist"
DEST_DIR="/var/www/relayzen/build"
 
# Change to the project directory
cd "$PROJECT_DIR"

npm i 
# Build the application
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed! Rolling back to the previous version..."
    exit 1
fi

# Clear the old files in the destination directory
sudo rm -rf "$DEST_DIR"/*
 
# Copy the new build files to the destination directory
sudo cp -r "$DIST_DIR"/* "$DEST_DIR"/
 
# Reload Nginx
sudo nginx -s reload
