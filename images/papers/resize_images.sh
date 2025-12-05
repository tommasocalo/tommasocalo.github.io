#!/bin/bash

# Script to resize all images in the papers directory to 2:1 width:height ratio
# Usage: ./resize_images.sh

echo "Resizing all images in papers directory to 2:1 width:height ratio..."

for image in *.{png,jpg,jpeg,PNG,JPG,JPEG}; do
    # Skip if no files match the pattern
    [ ! -f "$image" ] && continue
    
    echo "Processing: $image"
    
    # Get current dimensions
    width=$(sips -g pixelWidth "$image" | tail -1 | awk '{print $2}')
    height=$(sips -g pixelHeight "$image" | tail -1 | awk '{print $2}')
    
    # Calculate new dimensions for 2:1 ratio
    # We'll use the height as the base and make width = height * 2
    new_height=$height
    new_width=$((height * 2))
    
    # If current width is less than needed, use width as base instead
    if [ $width -lt $new_width ]; then
        new_width=$width
        new_height=$((width / 2))
    fi
    
    echo "  Original: ${width}x${height} -> New: ${new_width}x${new_height}"
    
    # Resize the image
    sips -z $new_height $new_width "$image" > /dev/null
    
    echo "  ✓ Resized $image"
done

echo "All images have been resized to 2:1 width:height ratio!"


