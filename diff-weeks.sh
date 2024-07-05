#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

# Function to check if input is a number
is_number() {
    case "$1" in
        ''|*[!0-9]*) return 1 ;;
        *) return 0 ;;
    esac
}

# Get repository name
REPO_NAME=$(basename -s .git `git config --get remote.origin.url`)
if [ -z "$REPO_NAME" ]; then
    REPO_NAME=$(basename "$PWD")
fi

SNAPSHOT_DIR="../${REPO_NAME}_weekly_snapshots"

# Check if snapshot directory exists
if [ ! -d "$SNAPSHOT_DIR" ]; then
    echo "Error: Snapshot directory not found. Please run the weekly snapshot script first."
    exit 1
fi

# Get user input for week numbers
read -p "Enter the first week number: " week1
read -p "Enter the second week number: " week2

# Validate inputs
if ! is_number "$week1" || ! is_number "$week2"; then
    echo "Error: Please enter valid week numbers."
    exit 1
fi

# Pad week numbers with zeros
week1_padded=$(printf "%03d" $week1)
week2_padded=$(printf "%03d" $week2)

# Check if snapshot directories exist
if [ ! -d "$SNAPSHOT_DIR/week_$week1_padded" ] || [ ! -d "$SNAPSHOT_DIR/week_$week2_padded" ]; then
    echo "Error: One or both of the specified week snapshots do not exist."
    exit 1
fi

# Exclude list
EXCLUDE_LIST=(
    "pnpm-lock.yaml"
    # Add more files or patterns to exclude here, for example:
    # "package-lock.json"
    # "*.log"
    # "*.md"
)

# Function to check if a file should be excluded
should_exclude() {
    local file="$1"
    for pattern in "${EXCLUDE_LIST[@]}"; do
        if [[ "${file##*/}" == $pattern ]]; then
            return 0  # Should exclude
        fi
    done
    return 1  # Should not exclude
}

# Function to display directory structure
display_directory_structure() {
    local dir="$1"
    local prefix=""
    local max_depth=3  # Adjust this value to control the depth of the directory tree

    find "$dir" -maxdepth $max_depth -not \( -path '*/node_modules*' -o -path '*/.git*' -o -path '*/dist*' -o -path '*/build*' \) -print | while read line; do
        local offset=$(($(echo "$line" | sed 's/[^/]//g' | wc -c) - $(echo "$dir" | sed 's/[^/]//g' | wc -c)))
        local spaces=$(printf '%*s' "$offset" '')
        echo "${spaces// /  }$(basename "$line")"
    done
}

# Function to check if a file is binary
is_binary() {
    local file="$1"
    local mime_type=$(file -b --mime-type "$file")
    local file_type=$(file -b "$file")

    # Check if the file is a known text format
    if [[ "$mime_type" == text/* ||
          "$mime_type" == application/json ||
          "$mime_type" == application/xml ||
          "$file_type" == *"JSON data"* ||
          "$file_type" == *"ASCII text"* ]]; then
        return 1  # Not binary
    else
        return 0  # Binary
    fi
}

# Function to extract full content from a snapshot
extract_snapshot_content() {
    local snapshot_dir="$1"
    local snapshot_name="$2"
    echo "Processing Snapshot: $snapshot_name"
    echo "----------------------------------------"
    echo "Generating directory structure..."
    display_directory_structure "$snapshot_dir"
    echo "----------------------------------------"
    echo "Reading file contents..."
    local file_count=0
    local total_files=$(find "$snapshot_dir" -type f -not \( -path '*/node_modules*' -o -path '*/.git*' -o -path '*/dist*' -o -path '*/build*' \) | wc -l)
    find "$snapshot_dir" -type f -not \( -path '*/node_modules*' -o -path '*/.git*' -o -path '*/dist*' -o -path '*/build*' \) | while read file; do
        file_count=$((file_count + 1))
        local relative_path="${file#$snapshot_dir/}"
        printf "Processing file %d of %d: %s\n" "$file_count" "$total_files" "$relative_path"
        if should_exclude "$relative_path"; then
            echo "Skipping excluded file: $relative_path"
        elif is_binary "$file"; then
            echo "Skipping binary file: $relative_path"
        else
            echo "----------------------------------------"
            cat "$file" || echo "Error reading file: $file"
            echo "----------------------------------------"
            echo
        fi
    done
    echo "Finished processing $total_files files for $snapshot_name"
    echo "========================================"
}

# Create a temporary file for the output
temp_file=$(mktemp)

echo "Starting to extract snapshot contents..."

# Extract information from both snapshots
{
    extract_snapshot_content "$SNAPSHOT_DIR/week_$week1_padded" "Week $week1"
    extract_snapshot_content "$SNAPSHOT_DIR/week_$week2_padded" "Week $week2"
} > "$temp_file"

echo "Finished extracting snapshot contents."

# Get the size of the temp file
file_size=$(wc -c < "$temp_file")
file_size_mb=$(echo "scale=2; $file_size / 1048576" | bc)

echo "Total size of snapshot contents: ${file_size_mb}MB"

# Prepare the prompt for Claude
prompt="I'm sending you the full contents of two snapshots of a codebase from different weeks. Please analyze this information and tell me the most significant changes that happened to the codebase between these two weeks. Focus on architectural changes, new features, removed features, and major refactorings. Here's the information:"

# Combine prompt and snapshot information
full_input="$prompt

$(cat "$temp_file")"

# Check if the input is too large (adjust the 10MB limit as needed)
if (( $(echo "$file_size_mb > 10" | bc -l) )); then
    echo "Warning: The snapshot content is larger than 10MB. This might be too much for a single request to Claude."
    echo "Consider analyzing smaller portions of the codebase or specific files."
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        rm "$temp_file"
        exit 1
    fi
fi

# Print the prompt (but not the full snapshot contents to avoid cluttering the terminal)
echo "Here's the prompt we'll send to Claude:"
echo "$prompt"
echo "... [Full snapshot contents not displayed due to size]"

# TODO: Send to Claude (replace with actual method when available)
echo "Sending to Claude for analysis..."
# Placeholder for sending to Claude and getting response
# response=$(send_to_claude "$full_input")
# echo "$response"

# Clean up
#rm "$temp_file"
echo "$temp_file"

echo "Analysis complete. (This is a placeholder - replace with actual API call and response handling)"