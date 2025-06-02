let redSlider, greenSlider, blueSlider;
let capture, detector, faceImg;
let faces = [];
let activeFilter = "none"; // Default to no filter
let goCaptureButton;

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(255); // white background

    //Create button to go back to capture image
    goCaptureButton = createButton('Go Back To Capture');
    goCaptureButton.position(200, 120);
    goCaptureButton.id('goCapture');
    goCaptureButton.mousePressed(() => {
        window.location.href = 'index.html'; // Redirect to index.html
    });


    let gridWidth = width * 0.65; // Take up 65% of screen width
    let gridHeight = height * 0.65; // Take up 65% of screen height
    let rows = 5; // Five total rows
    let colsPerRow = [3, 3, 3, 3, 3]; // each row has 3 columns

    let rowHeights = gridHeight / rows; // Each row's height
    let startY = (height - gridHeight) / 2; // Center vertically
    let gap = 30; // Space between boxes

    let labels = [
        "Webcam image", "Grayscale and\nbrightness + 20%", "Heatmap Extension",
        "Red channel", "Green channel", "Blue channel",
        "Threshold image", "Threshold image", "Threshold image",
        "Webcam image (repeat)", "Colour space 1", "Colour space 2",
        "Face detection\nand replaced face images", "Threshold image from\ncolour space 1", "Threshold image from\ncolour space 2"
    ];

    textAlign(CENTER, CENTER);
    textSize(14);
    fill(0);

    let index = 0;
    for (let row = 0; row < rows; row++) {
        let cols = colsPerRow[row]; // Get number of boxes in this row
        let cellWidth = (gridWidth - (cols - 1) * gap) / 3; // Fix: All boxes same size

        let totalRowWidth = cols * cellWidth + (cols - 1) * gap;
        let rowStartX = (width - totalRowWidth) / 2; // Center each row properly

        for (let col = 0; col < cols; col++) {

            let x = rowStartX + col * (cellWidth + gap);
            let y = startY + row * (rowHeights + gap);

            //draw the grid boxes
            stroke(0, 150, 0);
            noFill();
            rect(x, y, cellWidth, rowHeights);

            //draw the labels for each box
            let label = labels[index++];
            if (label) {
                fill(0);
                noStroke();
                text(label, x + cellWidth / 2, y + rowHeights + 15);
            }
        }

    }

    // Create threshold sliders for each channel
    redSlider = createSlider(0, 255, 127);
    greenSlider = createSlider(0, 255, 127);
    blueSlider = createSlider(0, 255, 127);
    redSlider.position(400, 600);
    redSlider.style('transform', 'rotate(-90deg)');
    greenSlider.position(width - 530, 600);
    greenSlider.style('transform', 'rotate(-90deg)');
    blueSlider.position(width - 260, 600);
    blueSlider.style('transform', 'rotate(-90deg)');

    // Create threshold sliders for CMY and HSV
    cmySlider = createSlider(0, 255, 127);
    hsvSlider = createSlider(0, 255, 127);

    // Position them vertically like rgb sliders
    cmySlider.position(width / 2 + 65, height - 150);
    cmySlider.style('transform', 'rotate(-90deg)');
    hsvSlider.position(width - 260, height - 150);
    hsvSlider.style('transform', 'rotate(-90deg)');

    //initialise video camera
    capture = createCapture(VIDEO);
    capture.size(160, 120);
    capture.hide();

    let scaleFactor = 1.2;
    detector = new objectdetect.detector(160, 120, scaleFactor, objectdetect.frontalface);
    faceImg = createImage(160, 120);


}


function draw() {
    let imgData = sessionStorage.getItem("capturedImage");
    if (imgData) {
        loadImage(imgData, img => {
            let gridWidth = width * 0.65;
            let gridHeight = height * 0.65;
            let rows = 5;
            let rowHeights = gridHeight / rows;

            let totalRowWidth = 3 * ((gridWidth - (3 - 1) * 30) / 3) + (3 - 1) * 30;
            let rowStartX = (width - totalRowWidth) / 2;
            let startY = (height - gridHeight) / 2;
            let boxWidth = (gridWidth - (3 - 1) * 30) / 3;

            //  1: Display Original Image in First Grid Box
            image(img, rowStartX, startY, boxWidth, rowHeights);

            //  2: Apply Grayscale & Brightness and Display in Second Grid Box
            let grayImg = GrayAndBright(img);
            image(grayImg, rowStartX + boxWidth + 30, startY, boxWidth, rowHeights);

            //  3: Extract RGB Channels and Display Them in Their Grid Positions
            let [redChannel, greenChannel, blueChannel] = RGBchannels(img);
            let row2Y = startY + rowHeights + 30; // Position for second row

            image(redChannel, rowStartX, row2Y, boxWidth, rowHeights); // Red channel
            image(greenChannel, rowStartX + boxWidth + 30, row2Y, boxWidth, rowHeights); // Green channel
            image(blueChannel, rowStartX + (boxWidth + 30) * 2, row2Y, boxWidth, rowHeights); // Blue channel

            //  4: Apply Thresholding and Display in Third Row
            let thresholdedRed = thresholdImage(redChannel, redSlider.value(), 'red');
            let thresholdedGreen = thresholdImage(greenChannel, greenSlider.value(), 'green');
            let thresholdedBlue = thresholdImage(blueChannel, blueSlider.value(), 'blue');

            let row3Y = row2Y + rowHeights + 30; // Position for third row
            image(thresholdedRed, rowStartX, row3Y, boxWidth, rowHeights);
            image(thresholdedGreen, rowStartX + boxWidth + 30, row3Y, boxWidth, rowHeights);
            image(thresholdedBlue, rowStartX + (boxWidth + 30) * 2, row3Y, boxWidth, rowHeights);

            //  5: Convert to CMY & HSV and Display in Grid
            let cmyImage = convertToCMY(img);
            let hsvImage = convertToHSV(img);

            let row4Y = row3Y + rowHeights + 30; // Position for fourth row (Color Space)

            image(img, rowStartX, row4Y, boxWidth, rowHeights);
            image(cmyImage, rowStartX + boxWidth + 30, row4Y, boxWidth, rowHeights); // Color Space 1
            image(hsvImage, rowStartX + (boxWidth + 30) * 2, row4Y, boxWidth, rowHeights); // Color Space 2

            //  6: Apply Thresholding to CMY & HSV and Display in Grid
            let thresholdedCMY = thresholdColorImage(cmyImage, cmySlider.value());
            let thresholdedHSV = thresholdColorImage(hsvImage, hsvSlider.value());

            let row5Y = row4Y + rowHeights + 30; // Position for fifth row (Thresholded Color Space)

            image(thresholdedCMY, rowStartX + boxWidth + 30, row5Y, boxWidth, rowHeights); // Thresholded CMY
            image(thresholdedHSV, rowStartX + (boxWidth + 30) * 2, row5Y, boxWidth, rowHeights); // Thresholded HSV

            // 7:  Face Detection
            image(capture, rowStartX, row5Y, boxWidth, rowHeights); // Display live webcam feed

            faceImg.copy(capture, 0, 0, capture.width, capture.height, 0, 0, 160, 120);
            faces = detector.detect(faceImg.canvas);

            if (faces.length > 0) {
                let face = faces[0];
                if (face[4] > 4) // check if face detection confidence score is above 4 
                {
                    let faceX = map(face[0], 0, 160, rowStartX, rowStartX + boxWidth);
                    let faceY = map(face[1], 0, 120, row5Y, row5Y + rowHeights);
                    let faceW = map(face[2], 0, 160, 0, boxWidth);
                    let faceH = map(face[3], 0, 120, 0, rowHeights);

                    noFill();
                    stroke(255);
                    strokeWeight(2);
                    rect(faceX, faceY, faceW, faceH);
                }
            }

            // 8: Face Detection with filters
            // Instruction text for keyboard controls
            fill(0);
            textSize(14);
            text("Press G - Grayscale\nPress B - Blurred\nPress C - Colour\nPress P - Pixelated",
                rowStartX - 90, row5Y + 80);

            if (faces.length > 0) {
                let face = faces[0];

                let faceX = map(face[0], 0, 160, rowStartX, rowStartX + boxWidth);
                let faceY = map(face[1], 0, 120, row5Y, row5Y + rowHeights);
                let faceW = map(face[2], 0, 160, 0, boxWidth);
                let faceH = map(face[3], 0, 120, 0, rowHeights);

                let liveFace = faceImg.get(face[0], face[1], face[2], face[3]); // Extract detected face

                // Apply active filter **only to the detected face**
                if (activeFilter === "grayscale") {
                    liveFace.filter(GRAY);
                } else if (activeFilter === "blur") {
                    liveFace.filter(BLUR, 3);
                } else if (activeFilter === "cmy") {
                    liveFace = convertToCMY(liveFace);
                } else if (activeFilter === "pixel") {
                    liveFace = pixelateImage(liveFace, 5); // Apply pixelation 
                }

                // **Redraw the full original image**
                image(capture, rowStartX, row5Y, boxWidth, rowHeights);

                // **Overlay the filtered face onto the original image at the correct position**
                image(liveFace, faceX, faceY, faceW, faceH);

                // 🔲 **Restore the white face detection rectangle**
                noFill();
                stroke(255); // White color
                strokeWeight(2);
                rect(faceX, faceY, faceW, faceH);
            } else {
                image(capture, rowStartX, row5Y, boxWidth, rowHeights); // Default live video
            }

            //  9: Heatmap Extension (Thermal Effect Implementation)
            let row1Y = startY; // First row Y position
            let col3X = rowStartX + (boxWidth + 30) * 2; // Third column (last box in first row)
            image(capture, col3X, row1Y, boxWidth, rowHeights); // Display live webcam feed

            // Process face detection
            faceImg.copy(capture, 0, 0, capture.width, capture.height, 0, 0, 160, 120);
            let facesExtension = detector.detect(faceImg.canvas);

            if (facesExtension.length > 0) {
                let face = facesExtension[0];

                if (face[4] > 4) { // Ensure face detection confidence
                    let faceX = map(face[0], 0, 160, col3X, col3X + boxWidth);
                    let faceY = map(face[1], 0, 120, row1Y, row1Y + rowHeights);
                    let faceW = map(face[2], 0, 160, 0, boxWidth);
                    let faceH = map(face[3], 0, 120, 0, rowHeights);

                    //  Extract and Convert to Grayscale for Heat Mapping
                    let detectedFace = faceImg.get(face[0], face[1], face[2], face[3]); // Extract detected face
                    let thermalFace = convertToThermal(detectedFace); // Apply thermal effect

                    //  Overlay the Processed Face (Thermal) Over Original
                    image(thermalFace, faceX, faceY, faceW, faceH);

                    // 🔲 Restore the white face detection rectangle
                    noFill();
                    stroke(255);
                    strokeWeight(2);
                    rect(faceX, faceY, faceW, faceH);
                }
            }

        });
    }
}


function keyPressed() {
    if (key === 'G' || key === 'g') {
        activeFilter = "grayscale";
    } else if (key === 'B' || key === 'b') {
        activeFilter = "blur";
    } else if (key === 'C' || key === 'c') {
        activeFilter = "cmy";
    } else if (key === 'P' || key === 'p') {
        activeFilter = "pixel";
    }
}



/**
 *  Function to Convert Image to Grayscale & Increase Brightness
 * @param {p5.Image} img - Input image
 * @returns {p5.Image} - Processed grayscale image with brightness increased
 */
function GrayAndBright(img) {
    let grayImg = createImage(img.width, img.height);
    grayImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    grayImg.loadPixels();

    for (let i = 0; i < grayImg.pixels.length; i += 4) {
        let r = grayImg.pixels[i];
        let g = grayImg.pixels[i + 1];
        let b = grayImg.pixels[i + 2];

        // Convert to grayscale
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Increase brightness by 20% but cap at 255
        let brightGray = min(gray * 1.2, 255);

        grayImg.pixels[i] = brightGray;
        grayImg.pixels[i + 1] = brightGray;
        grayImg.pixels[i + 2] = brightGray;
    }
    grayImg.updatePixels();
    return grayImg;
}

/**
 *  Function to Split Image into RGB Channels
 * @param {p5.Image} img - Input image
 * @returns {Array} - [Red Channel, Green Channel, Blue Channel]
 */
function RGBchannels(img) {
    let redChannel = createImage(img.width, img.height);
    let greenChannel = createImage(img.width, img.height);
    let blueChannel = createImage(img.width, img.height);

    img.loadPixels();
    redChannel.loadPixels();
    greenChannel.loadPixels();
    blueChannel.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
        let r = img.pixels[i];
        let g = img.pixels[i + 1];
        let b = img.pixels[i + 2];

        // Set only the red channel
        redChannel.pixels[i] = r;
        redChannel.pixels[i + 1] = 0;
        redChannel.pixels[i + 2] = 0;
        redChannel.pixels[i + 3] = 255; // Alpha (fully visible)

        // Set only the green channel
        greenChannel.pixels[i] = 0;
        greenChannel.pixels[i + 1] = g;
        greenChannel.pixels[i + 2] = 0;
        greenChannel.pixels[i + 3] = 255;

        // Set only the blue channel
        blueChannel.pixels[i] = 0;
        blueChannel.pixels[i + 1] = 0;
        blueChannel.pixels[i + 2] = b;
        blueChannel.pixels[i + 3] = 255;
    }

    redChannel.updatePixels();
    greenChannel.updatePixels();
    blueChannel.updatePixels();

    return [redChannel, greenChannel, blueChannel];
}

function thresholdImage(img, thresholdValue, channel) {
    let thresholdedImg = createImage(img.width, img.height);
    thresholdedImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    thresholdedImg.loadPixels();

    for (let i = 0; i < thresholdedImg.pixels.length; i += 4) {
        let value;
        if (channel === 'red') value = thresholdedImg.pixels[i];       // Red channel
        if (channel === 'green') value = thresholdedImg.pixels[i + 1]; // Green channel
        if (channel === 'blue') value = thresholdedImg.pixels[i + 2];  // Blue channel

        // Converts a single-channel image to black & white using a threshold.
        // Pixels above the threshold turn white (255), others turn black (0).
        let binaryValue = value > thresholdValue ? 255 : 0;

        thresholdedImg.pixels[i] = binaryValue;
        thresholdedImg.pixels[i + 1] = binaryValue;
        thresholdedImg.pixels[i + 2] = binaryValue;
    }
    thresholdedImg.updatePixels();
    return thresholdedImg;
}

/**
 * Convert Image to CMY Color Space
 * @param {p5.Image} img - Input image
 * @returns {p5.Image} - CMY color converted image
 */
function convertToCMY(img) {
    let cmyImg = createImage(img.width, img.height);
    cmyImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    cmyImg.loadPixels();

    for (let i = 0; i < cmyImg.pixels.length; i += 4) {
        let r = cmyImg.pixels[i];
        let g = cmyImg.pixels[i + 1];
        let b = cmyImg.pixels[i + 2];

        // CMY Conversion: C = 255 - R, M = 255 - G, Y = 255 - B
        cmyImg.pixels[i] = 255 - r;     // Cyan
        cmyImg.pixels[i + 1] = 255 - g; // Magenta
        cmyImg.pixels[i + 2] = 255 - b; // Yellow
    }
    cmyImg.updatePixels();
    return cmyImg;
}

/**
 * Convert Image to HSV Color Space
 * @param {p5.Image} img - Input image
 * @returns {p5.Image} - HSV color converted image
 */
function convertToHSV(img) {
    let hsvImg = createImage(img.width, img.height);
    hsvImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    hsvImg.loadPixels();

    for (let i = 0; i < hsvImg.pixels.length; i += 4) {
        let r = hsvImg.pixels[i] / 255;
        let g = hsvImg.pixels[i + 1] / 255;
        let b = hsvImg.pixels[i + 2] / 255;

        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let delta = max - min;

        let h, s, v;
        v = max;

        if (max === 0) {
            s = 0;
        } else {
            s = delta / max;
        }

        if (delta === 0) {
            h = 0;
        } else {
            if (max === r) {
                h = (g - b) / delta;
            } else if (max === g) {
                h = 2 + (b - r) / delta;
            } else {
                h = 4 + (r - g) / delta;
            }

            h = Math.min(h * 60, 360);
            if (h < 0) {
                h += 360;
            }
        }

        // Convert back to RGB for display (normalized 0-255)
        hsvImg.pixels[i] = h / 360 * 255; // Hue mapped to 0-255
        hsvImg.pixels[i + 1] = s * 255;   // Saturation mapped to 0-255
        hsvImg.pixels[i + 2] = v * 255;   // Value mapped to 0-255
    }

    hsvImg.updatePixels();
    return hsvImg;
}

/**
 * Apply Thresholding While Preserving Color Space
 * @param {p5.Image} img - Input CMY or HSV image
 * @param {Number} thresholdValue - Threshold value from slider
 * @returns {p5.Image} - Color-Preserved Thresholded Image
 */
function thresholdColorImage(img, thresholdValue) {
    let thresholdedImg = createImage(img.width, img.height);
    thresholdedImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    thresholdedImg.loadPixels();

    for (let i = 0; i < thresholdedImg.pixels.length; i += 4) {
        let r = thresholdedImg.pixels[i];
        let g = thresholdedImg.pixels[i + 1];
        let b = thresholdedImg.pixels[i + 2];

        // Calculate intensity (average of RGB)
        let intensity = (r + g + b) / 3;

        // If intensity is below the threshold, make pixel black (0,0,0)
        if (intensity < thresholdValue) {
            thresholdedImg.pixels[i] = 0;   // Red channel
            thresholdedImg.pixels[i + 1] = 0; // Green channel
            thresholdedImg.pixels[i + 2] = 0; // Blue channel
        }
        // Else, keep the original color
    }
    thresholdedImg.updatePixels();
    return thresholdedImg;
}

//face detection filters only to face not whole image
function applyGrayscale() {
    if (faces.length > 0) {
        let faceImgCopy = faceImg.get();
        faceImgCopy.filter(GRAY);
        transformedFace = faceImgCopy;
    }
}

function applyBlur() {
    if (faces.length > 0) {
        let faceImgCopy = faceImg.get();
        faceImgCopy.filter(BLUR, 3); // Adjust the blur intensity as needed
        transformedFace = faceImgCopy;
    }
}

function applyCMYConversion() {
    if (faces.length > 0) {
        transformedFace = convertToCMY(faceImg.get());
    }
}

function pixelateImage(img, blockSize) {
    let faceImgCopy = img.get(); // Get the detected face image
    faceImgCopy.loadPixels();

    for (let y = 0; y < faceImgCopy.height; y += blockSize) {
        for (let x = 0; x < faceImgCopy.width; x += blockSize) {
            let totalR = 0, totalG = 0, totalB = 0;
            let pixelCount = 0;

            // Calculate average color (R, G, B) for the block
            for (let by = 0; by < blockSize; by++) {
                for (let bx = 0; bx < blockSize; bx++) {
                    let px = x + bx;
                    let py = y + by;

                    if (px < faceImgCopy.width && py < faceImgCopy.height) {
                        let index = (py * faceImgCopy.width + px) * 4;
                        totalR += faceImgCopy.pixels[index];     // Red
                        totalG += faceImgCopy.pixels[index + 1]; // Green
                        totalB += faceImgCopy.pixels[index + 2]; // Blue
                        pixelCount++;
                    }
                }
            }

            let aveR = totalR / pixelCount;
            let aveG = totalG / pixelCount;
            let aveB = totalB / pixelCount;

            // Paint the entire block with the average color
            for (let by = 0; by < blockSize; by++) {
                for (let bx = 0; bx < blockSize; bx++) {
                    let px = x + bx;
                    let py = y + by;

                    if (px < faceImgCopy.width && py < faceImgCopy.height) {
                        let index = (py * faceImgCopy.width + px) * 4;
                        faceImgCopy.pixels[index] = aveR;
                        faceImgCopy.pixels[index + 1] = aveG;
                        faceImgCopy.pixels[index + 2] = aveB;
                        faceImgCopy.pixels[index + 3] = 255; // Alpha (fully visible)
                    }
                }
            }
        }
    }

    faceImgCopy.updatePixels();
    return faceImgCopy;
}

function convertToThermal(img) {
    let thermalImg = createImage(img.width, img.height);
    thermalImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    thermalImg.loadPixels();

    for (let i = 0; i < thermalImg.pixels.length; i += 4) {
        let r = thermalImg.pixels[i];
        let g = thermalImg.pixels[i + 1];
        let b = thermalImg.pixels[i + 2];

        // Convert to grayscale intensity
        let intensity = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply a Thermal Color Map
        let [tr, tg, tb] = mapThermalColor(intensity); // Get thermal color

        // Set new pixel color
        thermalImg.pixels[i] = tr;     // Red channel
        thermalImg.pixels[i + 1] = tg; // Green channel
        thermalImg.pixels[i + 2] = tb; // Blue channel
        thermalImg.pixels[i + 3] = 255; // Alpha (fully visible)
    }

    thermalImg.updatePixels();
    return thermalImg;
}

function mapThermalColor(value) {
    if (value < 51) {
        return [0, 0, map(value, 0, 50, 128, 255)]; // Dark blue to light blue
    } else if (value < 102) {
        return [0, map(value, 51, 101, 128, 255), 255]; // Blue to cyan
    } else if (value < 153) {
        return [0, 255, map(value, 102, 152, 255, 0)]; // Cyan to Green
    } else if (value < 204) {
        return [map(value, 153, 203, 0, 255), 255, 0]; // Green to Yellow
    } else {
        return [255, map(value, 204, 254, 255, 0), 0]; // Yellow to Red
    }
}
