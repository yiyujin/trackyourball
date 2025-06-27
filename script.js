// LOAD MODEL
let model = undefined;
const statusBar = document.querySelector(".statusBar");
const output = document.getElementById("model-output");

// if promise is resolved, run this callback (anonymous function)
cocoSsd.load()
  .then(function (loadedModel) {
  model = loadedModel;
  console.log("Model promise resolved");

  statusBar.innerText = "Model loaded";

  const jsonString = safeStringify(model);
  const parsedObject = JSON.parse(jsonString);
  output.data = parsedObject;
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