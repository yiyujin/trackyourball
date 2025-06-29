// LOAD MODEL
let model = undefined;
const statusBar = document.querySelector(".statusBar");
const output = document.getElementById("model-output");

// if promise is resolved, run this callback (anonymous function)
cocoSsd.load()
  .then(function (loadedModel) {
  model = loadedModel;
  console.log("Model promise resolved");

  statusBar.innerText = "Model is loaded.";

  const jsonString = safeStringify(model);
  const parsedObject = JSON.parse(jsonString);
  output.data = parsedObject;

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

loadImageButton.addEventListener("click", loadImage);

function loadImage(){
  imageInput.click();

  imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          preview.src = e.target.result;
          imagePreviewWrapper.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
}

function detectImage(){

}