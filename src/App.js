import React, { useState, useRef, useReducer } from "react";
// eslint-disable-next-line
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from "@tensorflow-models/mobilenet";
import "./App.css";

const machine = {
  initial: "initial",
  states: {
    initial: { on: { next: "loadingModel" } },
    loadingModel: { on: { next: "modelReady" } },
    modelReady: { on: { next: "imageReady" } },
    imageReady: { on: { next: "identifying" }, showImage: true },
    identifying: { on: { next: "complete" } },
    complete: { on: { next: "modelReady" }, showImage: true, showResults: true }
  }
};

function App() {
  const [results, setResults] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const [model, setModel] = useState(null);
  const imageRef = useRef();
  const inputRef = useRef();

  // Statistics
  const [count, setCount] = useState(0);
  const [correct, setCorrect] = useState(0);
  
  const reducer = (state, event) =>
    machine.states[state].on[event] || machine.initial;

  const [appState, dispatch] = useReducer(reducer, machine.initial);
  const next = () => dispatch("next");

  const loadModel = async () => {
    next();
    const model = await mobilenet.load(
      {
        version: 1,
        alpha: 1.0
      }
    );
    //const modelUrl = 'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json';
    //const modelUrl = 'http://localhost:3000/model/model.json';
    //const model = await tf.loadModel(modelUrl);
    setModel(model);
    next();
  };

  const identify = async () => {
    next();
    const results = await model.classify(imageRef.current);
    //const results = await model.predict(imageRef.current);
    setResults(results);
    next();
  };

  const nextImage = async () => {
    setResults([]);
    next();
  };

  const upload = () => inputRef.current.click();

  const handleUpload = event => {
    const { files } = event.target;
    if (files.length > 0) {
      const url = URL.createObjectURL(event.target.files[0]);
      setImageURL(url);
      next();
    }
  };

  const handleCorrectPrediction = () => {
    setCount(count + 1);
    setCorrect(correct + 1);
  };

  const handleWrongPrediction = () => {
    setCount(count + 1);
  }; 

  const actionButton = {
    initial: { action: loadModel, text: "Load Model" },
    loadingModel: { text: "Loading Model..." },
    modelReady: { action: upload, text: "Upload Image" },
    imageReady: { action: identify, text: "Identify Breed" },
    identifying: { text: "Identifying..." },
    complete: { action: nextImage, text: "Identify Next Image" }
  };

  const { showImage, showResults } = machine.states[appState];

  return (
    <div>
      {showImage && <img src={imageURL} alt="upload-preview" ref={imageRef} />}
      <input
        type="file"
        accept="image/*"
        capture="camera"
        onChange={handleUpload}
        ref={inputRef}
      />
      {showResults && (
        <ul>
          {results.map(({ className, probability }) => (
            <li key={className}>{`${className}: ${(probability * 100).toFixed(
              2
            )}%`}</li>
          ))}
        </ul>
      )}
      {showResults && (
        <div>
        <ul>
          <li>Number of images : {count}</li>
          <li>Correct predictions : {correct}</li>
          <li>Accuracy : {count === 0 ? null : (correct / count * 100).toFixed(2)}%</li>
        </ul>
        <button onClick={handleCorrectPrediction}>Correct Prediction</button>
        <button onClick={handleWrongPrediction}>Wrong Prediction</button>
        </div>        
      )}
      <button onClick={actionButton[appState].action || (() => {})}>
        {actionButton[appState].text}
      </button>
    </div>
  );
}

export default App;
