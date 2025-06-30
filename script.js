// === GLOBAL STATE ===
let model = undefined;
let imageUrl = null;
let imageElement = null;
let videoElement = null;
let mediaDetections = [];

const mediaContainer = document.getElementById("mediaContainer");
const explainer = document.querySelector(".explainer");

// === LOAD MODEL ===
addMessage("Model is loading..");

cocoSsd.load().then(function (loadedModel) {
  model = loadedModel;
  console.log("Model loaded");

  addMessage("Model is loaded.");

  const jsonString = safeStringify(model);
  const parsedObject = JSON.parse(jsonString);
  let json = document.createElement("andypf-json-viewer");
  json.data = parsedObject;
  explainer.append(json);

  const buttons = document.querySelectorAll(".container button");
  buttons.forEach(button => {
    button.disabled = false;
    button.removeAttribute('disabled');
  });

}).catch(err => {
  console.error("Model promise rejected:", err);
  addMessage("Model failed to load.");
});

// === UTILITY FUNCTIONS ===
function safeStringify(obj, indent = 2) {
  const seen = new WeakSet();
  return JSON.stringify(obj, function (key, value) {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  }, indent);
}

function addMessage(msgContent) {
  const msg = document.createElement("p");
  msg.textContent = msgContent;
  explainer.append(msg);
  explainer.scrollTop = explainer.scrollHeight;
}

function clearDrawings() {
  mediaDetections.forEach(el => mediaContainer.removeChild(el));
  mediaDetections = [];
}

function resetFile() {
  if(videoBlobURL){
    URL.revokeObjectURL(videoBlobURL);
    videoBlobURL = null;
  }

  mediaContainer.innerHTML = '';
  mediaDetections = [];
  imageElement = null;
  videoElement = null;
  imageUrl = null;
  videoUrl = null;
  mediaContainer.style.display = "none";
}

// === FILE INPUT HANDLERS ===
const imageInput = document.getElementById("image-input");
const videoInput = document.getElementById("video-input");

const loadImageButton = document.getElementById("loadImageButton");
const loadVideoButton = document.getElementById("loadVideoButton");
const detectImageButton = document.getElementById("detectImageButton");

loadImageButton.addEventListener("click", () => imageInput.click());
loadVideoButton.addEventListener("click", () => videoInput.click());

imageInput.addEventListener("change", handleImageChange);
videoInput.addEventListener("change", handleVideoChange);

let videoBlobURL = null;

function handleImageChange() {
  const file = imageInput.files[0];
  if (!file) return;

  resetFile();

  const reader = new FileReader();
  reader.onload = e => {
    imageUrl = e.target.result;
    imageElement = document.createElement("img");
    imageElement.className = "file";
    imageElement.src = imageUrl;

    mediaContainer.appendChild(imageElement);
    mediaContainer.style.display = "block";

    clearDrawings();
  };
  reader.readAsDataURL(file);

  addMessage(`Image is added. ${file.name}`);

  detectImageButton.disabled = false;

  imageInput.value = "";  // Reset input so same image can be selected again
}

function handleVideoChange() {
  const file = videoInput.files[0];
  if (!file) return;

  resetFile();

  videoBlobURL = URL.createObjectURL(file);
  videoElement = document.createElement("video");
  videoElement.className = "file";
  videoElement.controls = true;
  videoElement.src = videoBlobURL;

  mediaContainer.appendChild(videoElement);
  mediaContainer.style.display = "block";

  videoElement.addEventListener("play", () => {
    addMessage("Video playing, detection started.");
    detectVideoFrame();
  });

  videoElement.addEventListener("playing", () => {
    addMessage("Video is now playing, starting detection");
    detectVideoFrame();
  });

  videoElement.addEventListener("pause", () => {
    addMessage("Video paused, detection stopped.");
  });

  videoElement.addEventListener("ended", () => {
    addMessage("Video ended, detection stopped.");
  });

  videoElement.load();

  addMessage(`Video is added. ${file.name}`);

  videoInput.value = "";  // Reset input so same video can be selected again
}

// === DETECTION ===
function detectImage() {
  if (!model || !imageElement) return;

  addMessage("Detecting image...");

  model.detect(imageElement).then(predictions => {
    addMessage(`Detection complete! Found ${predictions.length} objects.`);

    let json = document.createElement("andypf-json-viewer");
    json.data = predictions;
    explainer.append(json);

    clearDrawings();
    drawBoundingBoxes(predictions);
  }).catch(err => {
    console.error("Detection failed:", err);
    addMessage("Detection failed.");
  });
}

function detectVideoFrame() {
  if (!model || !videoElement || videoElement.paused || videoElement.ended) return;

  model.detect(videoElement).then(predictions => {
    clearDrawings();

    addMessage(`Detected video frame. Found ${predictions.length} objects.`);
    let json = document.createElement("andypf-json-viewer");
    json.data = predictions;
    explainer.append(json);

    drawBoundingBoxes(predictions);

    // Keep looping only if the video is still playing
    if (!videoElement.paused && !videoElement.ended) {
      requestAnimationFrame(detectVideoFrame);
    }
  }).catch(err => {
    console.error("Video detection failed:", err);
    addMessage("Detection failed.");
  });
}

function drawBoundingBoxes(predictions) {
  const input = document.getElementById("confidenceInput");
  const confidenceThreshold = parseFloat(input?.value) || 0;

  const media = imageElement || videoElement;
  if (!media) return;

  let scaleX = 1, scaleY = 1;

  // Only scale for video, since images render 1:1 by default
  if (videoElement) {
    const displayWidth = videoElement.clientWidth;
    const displayHeight = videoElement.clientHeight;
    const naturalWidth = videoElement.videoWidth;
    const naturalHeight = videoElement.videoHeight;

    scaleX = displayWidth / naturalWidth;
    scaleY = displayHeight / naturalHeight;
  }

  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i].score > confidenceThreshold) {
      const [x, y, width, height] = predictions[i].bbox;

      const xScaled = x * scaleX;
      const yScaled = y * scaleY;
      const widthScaled = width * scaleX;
      const heightScaled = height * scaleY;

      const label = document.createElement("p");
      label.className = "label";
      label.innerText = `${predictions[i].class} (${Math.round(predictions[i].score * 100)})`;
      label.style = `margin-left:${xScaled}px; margin-top:${yScaled - 10}px; top:0; left:0;`;

      const box = document.createElement("div");
      box.className = "boundingbox";
      box.style = `left:${xScaled}px; top:${yScaled}px; width:${widthScaled}px; height:${heightScaled}px;`;

      mediaContainer.appendChild(label);
      mediaContainer.appendChild(box);

      mediaDetections.push(label);
      mediaDetections.push(box);
    }
  }
}