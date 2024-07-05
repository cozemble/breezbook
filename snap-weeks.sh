#!/bin/bash

# Get the repository name
REPO_NAME=$(basename -s .git `git config --get remote.origin.url`)
if [ -z "$REPO_NAME" ]; then
    REPO_NAME=$(basename "$PWD")
fi

SNAPSHOT_DIR="../${REPO_NAME}_weekly_snapshots"
DIFF_DIR="../${REPO_NAME}_weekly_diffs"
WEEK_SECONDS=604800  # 7 days in seconds

# Get the timestamp of the first commit
first_commit_timestamp=$(git rev-list --max-parents=0 HEAD | xargs git show -s --format=%ct)

# Get the timestamp of the latest commit
latest_commit_timestamp=$(git show -s --format=%ct HEAD)

# Create the snapshot and diff directories if they don't exist
mkdir -p "$SNAPSHOT_DIR"
mkdir -p "$DIFF_DIR"

# Function to create a snapshot for a given timestamp
create_snapshot() {
    local timestamp=$1
    local week_number=$2
    local snapshot_name="week_$(printf "%03d" $week_number)"
    local snapshot_path="$SNAPSHOT_DIR/$snapshot_name"

    if [ ! -d "$snapshot_path" ]; then
        mkdir -p "$snapshot_path"
        git_date=$(date -r $timestamp "+%Y-%m-%d %H:%M:%S")
        git archive --format=tar $(git rev-list -n 1 --before="$git_date" HEAD) | tar -x -C "$snapshot_path"
        echo "Created snapshot: $snapshot_name"

        # Generate diff if it's not the first week
        if [ $week_number -gt 1 ]; then
            local prev_week=$((week_number - 1))
            local prev_snapshot_path="$SNAPSHOT_DIR/week_$(printf "%03d" $prev_week)"
            local diff_file="$DIFF_DIR/diff_week_${prev_week}_to_${week_number}.txt"

            echo "Generating diff between Week $prev_week and Week $week_number..."
            diff -r -N -x 'node_modules' -x '.git' -x 'dist' -x 'build' \
                "$prev_snapshot_path" "$snapshot_path" > "$diff_file" 2>/dev/null || true
            echo "Diff saved to: $diff_file"
        fi
    else
        echo "Snapshot already exists: $snapshot_name"
    fi
}

# Iterate through the repository history in weekly chunks
current_timestamp=$first_commit_timestamp
week_count=1

while [ $current_timestamp -le $latest_commit_timestamp ]; do
    create_snapshot $current_timestamp $week_count
    current_timestamp=$((current_timestamp + WEEK_SECONDS))
    week_count=$((week_count + 1))
done

echo "Weekly snapshots and diffs creation complete."

# Print summary
echo "Total number of weeks: $((week_count - 1))"
echo "Snapshots are stored in: $SNAPSHOT_DIR"
echo "Diffs are stored in: $DIFF_DIR"