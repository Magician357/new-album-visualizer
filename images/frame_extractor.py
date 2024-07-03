import os
from PIL import Image

def extract_frames(gif_path):
    # Ensure the file exists
    if not os.path.isfile(gif_path):
        raise FileNotFoundError(f"No file found at {gif_path}")

    # Extract the directory and file name
    dir_name, gif_name = os.path.split(gif_path)
    gif_name_without_ext = os.path.splitext(gif_name)[0]

    # Create a new folder with the same name as the gif
    output_folder = os.path.join(dir_name, gif_name_without_ext)
    os.makedirs(output_folder, exist_ok=True)

    # Open the gif file
    with Image.open(gif_path) as img:
        frame_number = 0
        while True:
            try:
                img.seek(frame_number)
                frame = img.copy()
                frame_number_str = f"{frame_number:03}.png"
                frame.save(os.path.join(output_folder, frame_number_str), "PNG")
                frame_number += 1
            except EOFError:
                break

    print(f"Extracted {frame_number} frames to {output_folder}")

# Example usage
gif_path = input("file path: ")
extract_frames(gif_path)
