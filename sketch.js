let video; // live webcam feed
let snapshot; // captured image
let scaledSnapshot; // resized version of snapshot

function setup() {
    createCanvas(640, 480);  // Creates a 640x480 pixel canvas.
    video = createCapture(VIDEO); // Captures webcam feed.
    video.size(640, 480);  // Sets video resolution to match the canvas.
    video.hide();  // Hides the default video element.

    textSize(16);
    textAlign(CENTER, CENTER);
}


function draw() {
    background(220);

    // Display live webcam feed
    image(video, 0, 0, width, height);

    // Display instructions if no snapshot taken yet
    if (!scaledSnapshot) {
        fill(0);
        rectMode(CENTER);
        rect(width / 2, height - 30, 300, 40, 10); // black box for contrasting white font
        fill(255);
        text("Click anywhere to take a snapshot", width / 2, height - 30);

    }

    // Show scaled snapshot if taken
    if (scaledSnapshot) {
        image(scaledSnapshot, width / 2 - 80, height - 140, 160, 120);
        fill(0);
        text("Scaled Snapshot", width / 2, height - 130);
    }
}

// Take snapshot and scale it
function mousePressed() {
    snapshot = video.get(); // Capture original frame
    scaledSnapshot = createImage(160, 120); // Create a new empty image with correct size

    scaledSnapshot.copy(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, 160, 120);

    // Convert image to Base64 and store in sessionStorage
    scaledSnapshot.loadPixels();
    let imgBase64 = scaledSnapshot.canvas.toDataURL(); // Convert to Base64
    sessionStorage.setItem("capturedImage", imgBase64); // Store in memory

    setTimeout(() => {
        window.location.href = "grid.html"; // Redirect after 1 second
    }, 1000);
}
