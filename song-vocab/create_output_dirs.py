import os

def create_output_directories():
    """Create the necessary output directories if they don't exist."""
    output_dirs = [
        "outputs/lyrics",
        "outputs/vocabulary"
    ]
    
    for directory in output_dirs:
        os.makedirs(directory, exist_ok=True)
        print(f"Created directory: {directory}")
    
    print("Output directories setup complete.")

if __name__ == "__main__":
    create_output_directories()
