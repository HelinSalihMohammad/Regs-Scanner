document.addEventListener("DOMContentLoaded", function() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");

  // Get user media (camera)
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(function(stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // Required for iOS Safari
      video.play();
    })
    .catch(function(err) {
      console.error("Error accessing camera: " + err);
    });

  // Function to scan the video frame for QR code
  function scanQRCode() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas size to match video size
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;

      // Draw the current frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      
      if (code) {
        const qrCodeData = code.data;
        
        // Check if the QR code has been scanned before (stored in localStorage)
        if (localStorage.getItem(qrCodeData)) {
          alert("This QR Code has already been used.");
        } else {
          alert("QR Code Scanned: " + qrCodeData); // Display the decoded QR code data

          // Mark the QR code as used by saving it in localStorage
          localStorage.setItem(qrCodeData, "used");

          // Send the QR code data to Google Sheets (via Apps Script Web App)
          fetch('https://script.google.com/macros/s/AKfycbzBVy9dRQFh8CjySBBqvrYRqQBFNX51lEutUtDOJWJA6o93vZiIEOwdXho8JeQXtTnmOA/exec', {
            method: 'POST',
            body: new URLSearchParams({
              qrCode: qrCodeData  // Send the scanned QR code data
            })
          })
          .then(response => response.text())
          .then(responseData => {
            console.log(responseData); // Log the response from the server
          })
          .catch(error => {
            console.error('Error:', error); // Handle any errors
          });
        }
      }
    }

    // Continue scanning the next frame
    requestAnimationFrame(scanQRCode);
  }

  // Start scanning when the video is playing
  video.addEventListener("play", function() {
    scanQRCode();
  });
});
