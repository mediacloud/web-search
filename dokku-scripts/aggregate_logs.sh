#!/bin/bash

# Usage: ./aggregate_logs.sh <app-name> <log-file-path-in-container>
# Example: ./aggregate_logs.sh my-app /app/request_log.log

APP_NAME=$1
LOG_PATH_IN_CONTAINER=$2
TEMP_DIR="/tmp/${APP_NAME}_logs"
AGGREGATED_LOG_FILE="./${APP_NAME}_aggregated.log"

# Check that both arguments are provided
if [[ -z "$APP_NAME" || -z "$LOG_PATH_IN_CONTAINER" ]]; then
  echo "Usage: $0 <app-name> <log-file-path-in-container>"
  exit 1
fi

# Clear any existing temporary directory and aggregated log file
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
rm -f "$AGGREGATED_LOG_FILE"

# List all containers for the app and filter for web workers
CONTAINERS=$(docker ps --filter "name=${APP_NAME}.web" --format "{{.ID}}")

# Check if any containers were found
if [[ -z "$CONTAINERS" ]]; then
  echo "No web containers found for app ${APP_NAME}."
  exit 1
fi

# Loop over each container and copy the log file to the temp directory
for CONTAINER in $CONTAINERS; do
  CONTAINER_LOG_FILE="${TEMP_DIR}/${CONTAINER}_log.log"
  echo "Copying log from container ${CONTAINER}..."
  docker cp "${CONTAINER}:${LOG_PATH_IN_CONTAINER}" "$CONTAINER_LOG_FILE"
done

# Concatenate all log files into one aggregated file
echo "Aggregating logs into ${AGGREGATED_LOG_FILE}..."
cat ${TEMP_DIR}/*_log.log > "$AGGREGATED_LOG_FILE"

# Optionally, clean up the temporary files
rm -rf "$TEMP_DIR"

echo "Log aggregation complete. Aggregated logs are available at ${AGGREGATED_LOG_FILE}."