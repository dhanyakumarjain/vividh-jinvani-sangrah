#!/usr/bin/env python3
"""
Generate git-info.json with the latest commit date
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

def get_last_commit_date():
    """Get the date of the last git commit"""
    try:
        # Get the last commit date in ISO format
        result = subprocess.run(
            ['git', 'log', '-1', '--format=%cI'],
            capture_output=True,
            text=True,
            check=True
        )
        commit_date = result.stdout.strip()
        return commit_date
    except subprocess.CalledProcessError:
        print("Warning: Could not get git commit date. Using current date.", file=sys.stderr)
        return datetime.now().isoformat()
    except FileNotFoundError:
        print("Warning: Git not found. Using current date.", file=sys.stderr)
        return datetime.now().isoformat()

def get_last_commit_hash():
    """Get the short hash of the last commit"""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except:
        return "unknown"

def main():
    # Get project root (two levels up from this script)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    data_dir = project_root / 'data'
    
    # Ensure data directory exists
    data_dir.mkdir(exist_ok=True)
    
    # Get git info
    commit_date = get_last_commit_date()
    commit_hash = get_last_commit_hash()
    
    # Create git info object
    git_info = {
        "lastCommitDate": commit_date,
        "lastCommitHash": commit_hash,
        "generatedAt": datetime.now().isoformat()
    }
    
    # Write to file
    output_file = data_dir / 'git-info.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(git_info, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Generated {output_file}")
    print(f"  Last commit: {commit_date}")
    print(f"  Commit hash: {commit_hash}")

if __name__ == '__main__':
    main()
