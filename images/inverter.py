import os
from PIL import Image, ImageOps

def invert_image(image_path):
    # sourcery skip: inline-immediately-returned-variable
    # Open the image
    image = Image.open(image_path).convert("RGBA")
    
    # Separate the image into individual bands
    r, g, b, a = image.split()
    
    # Invert the RGB bands
    r = ImageOps.invert(r)
    g = ImageOps.invert(g)
    b = ImageOps.invert(b)
    
    # Merge the bands back together
    inverted_image = Image.merge("RGBA", (r, g, b, a))
    
    return inverted_image

def process_images_in_folder(folder_path):
    for filename in os.listdir(folder_path):
        if filename.endswith(('.png', '.jpg', '.jpeg', '.gif')):
            image_path = os.path.join(folder_path, filename)
            inverted_image = invert_image(image_path)
            
            # Save the inverted image back to the folder
            inverted_image.save(image_path)
            print(f"Inverted {filename}")

# Folder containing images
folder_path = 'D:\\programs\\new-album-visualizer\\images\\light window'

# Process images in the specified folder
process_images_in_folder(folder_path)
