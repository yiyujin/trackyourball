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

  statusBar.innerText = "Model failed to load.";
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
const imagePreview = document.getElementById('preview');
const imagePreviewWrapper = document.getElementById('imagePreviewWrapper');

loadImageButton.addEventListener("click", loadImage);

let imageUrl = null;

function loadImage(){
  imageInput.click();

  imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          imageUrl = e.target.result; // set image url here

          imagePreview.src = imageUrl;
          imagePreviewWrapper.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }

      // console.log(file);
    });
}

let imageChildren = [];

function detectImage(){
  if(!model || !imageUrl ){ return; } // just in case

  addMessage("Detecting image...")

  model.detect(imagePreview).then(function(predictions){
    console.log('Image predictions : ', predictions);

    // Clear previous image predictions
    for (let i = 0; i < imageChildren.length; i++) {
      imageContainer.removeChild(imageChildren[i]);
    }
    imageChildren.splice(0);
    
    addMessage(`Detection complete! Found ${predictions.length} objects.`);

    let json = document.createElement("andypf-json-viewer");
    json.data = predictions;
    explainer.append(json);

    drawBoundingBoxes(predictions);
  }).catch(function(error){
    console.error('Detection failed:', error);
    
    let msg = document.createElement("p");
    msg.textContent = "Detection failed. Please try again.";
    msg.style.color = "red";
    explainer.append(msg);
  });
}

function drawBoundingBoxes(predictions){
  const confidenceThreshold = 0;

  for(let i = 0; i < predictions.length; i++){
    if(predictions[i].score > confidenceThreshold){
      // DRAW LABEL
      const label = document.createElement("p");
      label.setAttribute("class", "label");
      label.innerText = predictions[i].class + " (" + Math.round(predictions[i].score * 100) + ")";
      label.style = `margin-left : ${predictions[i].bbox[0]}px; margin-top: ${(predictions[i].bbox[1] - 10)}px; top: 0; left: 0;`;
      
      //DRAW BOUNDINGBOX
      const boundingbox = document.createElement("div");
      boundingbox.setAttribute("class", "boundingbox");
      boundingbox.style = `left : ${predictions[i].bbox[0]}px; top : ${predictions[i].bbox[1]}px; width : ${predictions[i].bbox[2]}px; height : ${predictions[i].bbox[3]}px;`;

      imagePreviewWrapper.appendChild(label);
      imagePreviewWrapper.appendChild(boundingbox);

      imageChildren.push(boundingbox);
      imageChildren.push(label);
    }
  }
}

function addMessage(msgContent){
  let newMessage = document.createElement("p");
  newMessage.textContent = msgContent;
  explainer.append(newMessage);
}