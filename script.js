// LOAD MODEL
let model = undefined;
const statusBar = document.querySelector(".statusBar");
const output = document.getElementById("model-output");

const explainer = document.querySelector(".explainer");
addMessage("Model is loading..");

cocoSsd.load()
  .then(function (loadedModel) {
  model = loadedModel;
  console.log("Model promise resolved");

  addMessage("Model is loaded.");

  const jsonString = safeStringify(model);
  const parsedObject = JSON.parse(jsonString);
  let json = document.createElement("andypf-json-viewer");
  json.data = parsedObject;
  explainer.append(json);

  const buttons = document.querySelectorAll("button");
  buttons.forEach( (button) => {
    button.disabled = false;
    button.removeAttribute('disabled');
  });

}).catch(function(err){
  console.error("Model promise rejected.", err);
  addMessage("Model failed to load.");
});

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

// IMAGE
const loadImageButton = document.getElementById("loadImageButton");
const imageInput = document.getElementById('image-input');
const imagePreview = document.getElementById('previewImage');
const previewWrapper = document.getElementById('previewWrapper');

loadImageButton.addEventListener("click", loadImage);

let imageUrl = null;
let imageChildren = [];

function loadImage(){
  imageInput.click();

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        imageUrl = e.target.result; // set image url here

        imagePreview.src = imageUrl;
        previewWrapper.style.display = 'block';

        clearDrawings();
      };
      reader.readAsDataURL(file);

      addMessage("Image added.");
    }
  });
}

function detectImage(){
  if(!model || !imageUrl ){ return; } // just in case

  addMessage("Detecting image...");

  model.detect(imagePreview).then(function(predictions){
    console.log('Image predictions : ', predictions);
    addMessage(`Detection complete! Found ${predictions.length} objects.`);

    let json = document.createElement("andypf-json-viewer");
    json.data = predictions;
    explainer.append(json);

    drawBoundingBoxes(predictions);
  }).catch(function(error){
    console.error('Detection failed : ', error);
    addMessage("Detection failed.");
  });
}

function drawBoundingBoxes(predictions, fileType) {
  const confidenceThreshold = 0;

  const mediaElement = fileType === "video" ? videoPlayer : imagePreview;

  let scaleX = 1, scaleY = 1;

  if (fileType === "video") {
    const naturalWidth = mediaElement.videoWidth;
    const naturalHeight = mediaElement.videoHeight;
    const renderedWidth = mediaElement.clientWidth;
    const renderedHeight = mediaElement.clientHeight;

    scaleX = renderedWidth / naturalWidth;
    scaleY = renderedHeight / naturalHeight;
  }

  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i].score > confidenceThreshold) {
      const [x, y, width, height] = predictions[i].bbox;

      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledW = width * scaleX;
      const scaledH = height * scaleY;

      // LABEL
      const label = document.createElement("p");
      label.setAttribute("class", "label");
      label.innerText = predictions[i].class + " (" + Math.round(predictions[i].score * 100) + ")";
      label.style = `
        margin-left : ${scaledX}px;
        margin-top: ${scaledY - 10}px;
        top: 0; left: 0;
      `;

      // BOUNDING BOX
      const boundingbox = document.createElement("div");
      boundingbox.setAttribute("class", "boundingbox");
      boundingbox.style = `
        left: ${scaledX}px;
        top: ${scaledY}px;
        width: ${scaledW}px;
        height: ${scaledH}px;
      `;

      previewWrapper.appendChild(label);
      previewWrapper.appendChild(boundingbox);

      imageChildren.push(boundingbox);
      imageChildren.push(label);
    }
  }
}


function clearDrawings(){
  for (let i = 0; i < imageChildren.length; i++) {
    previewWrapper.removeChild(imageChildren[i]);
  }
  imageChildren.splice(0);
}

function addMessage(msgContent){
  let newMessage = document.createElement("p");
  newMessage.textContent = msgContent;
  explainer.append(newMessage);
}

// VIDEO
const loadVideoButton = document.getElementById("loadVideoButton");
const videoInput = document.getElementById("video-input");
const videoPlayer = document.getElementById("previewVideo");

let videoURL = null;

loadVideoButton.addEventListener("click", () => {
  videoInput.click();
});

videoInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const videoURL = URL.createObjectURL(file);
  videoPlayer.src = videoURL;
  previewWrapper.style.display = 'block';
  
  videoPlayer.load();
  // videoPlayer.play();

  // Clean up the object URL when the video ends
  videoPlayer.onended = () => {
    URL.revokeObjectURL(videoURL);
  };
});

function detectVideoFrame(){
  addMessage("Detecting video..");

  model.detect(videoPlayer).then(function(predictions){
    clearDrawings();

    addMessage(`Detected video frame. Found ${predictions.length} objects.`);
    let json = document.createElement("andypf-json-viewer");
    json.data = predictions;
    explainer.append(json);

    drawBoundingBoxes(predictions, "video");

    if (!videoPlayer.ended) {
      requestAnimationFrame(detectVideoFrame);
    } else {
      addMessage("Video ended, detection stopped.");
    }
  }).catch(function(error){
    console.error('Detection failed : ', error);

    addMessage("Detection failed.");
  });
}