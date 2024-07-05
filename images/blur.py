from PIL import Image, ImageDraw, ImageFilter
import random
import os

def generate_blurred_noise(scaled_width, scaled_height, blur_radius, scale_factor=5):
    # Calculate original dimensions
    width = scaled_width // scale_factor
    height = scaled_height // scale_factor

    # Create a new smaller image with white background
    image = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(image)

    # Generate random noise
    for x in range(width):
        for y in range(height):
            color = random.randint(0, 75)
            colors = (color, color, color)
            draw.point((x, y), fill=colors)

    # Scale up the image to desired dimensions
    scaled_image = image.resize((scaled_width, scaled_height), Image.NEAREST)

    # Apply blur effect
    blurred_image = scaled_image.filter(ImageFilter.GaussianBlur(blur_radius))

    return blurred_image

def save_images(num_images, scaled_width, scaled_height, blur_radius, output_dir, output_prefix=""):
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    for i in range(num_images):
        blurred_image = generate_blurred_noise(scaled_width, scaled_height, blur_radius)
        filename = os.path.join(output_dir, f"{output_prefix}{i:03d}.png")  # Format filename with leading zeros
        blurred_image.save(filename)
        print(f"Image {i} saved as {filename}")

# Parameters
num_images = 5       # Number of images to generate
scaled_width = 2500  # Desired scaled width of each image
scaled_height = 2500 # Desired scaled height of each image
blur_radius = 2      # Blur radius for Gaussian blur
output_directory = "images/blurred_images"  # Output directory name

# Generate and save images
save_images(num_images, scaled_width, scaled_height, blur_radius, output_directory)
