import React, { useState, useEffect } from "react";

function AltTextGenerator() {
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [predictionId, setPredictionId] = useState(null);

  const API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN;

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const createPrediction = async () => {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${API_TOKEN}`,
      },
      body: JSON.stringify({
        version:
          "2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
        input: { image: imageUrl },
      }),
    });
    return response.json();
  };

  const getPrediction = async (id) => {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        headers: {
          Authorization: `Token ${API_TOKEN}`,
        },
      }
    );
    return response.json();
  };

  const handleGenerateAltText = async () => {
    if (!isValidUrl(imageUrl)) {
      setError("Please enter a valid URL.");
      return;
    }

    setIsLoading(true);
    setError("");
    setAltText("");
    setPredictionId(null);

    try {
      const prediction = await createPrediction();
      console.log("Initial Prediction:", prediction);

      if (prediction.id) {
        setPredictionId(prediction.id);
      } else {
        throw new Error("Failed to start prediction.");
      }
    } catch (err) {
      setError(err.message || "An error occurred while generating alt text.");
      console.error("Fetch error:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let pollInterval;

    const pollForResult = async () => {
      if (predictionId) {
        try {
          const prediction = await getPrediction(predictionId);
          console.log("Polling Response:", prediction);

          if (prediction.status === "succeeded" && prediction.output) {
            setAltText(prediction.output);
            setIsLoading(false);
            setShowSnackbar(true);
            clearInterval(pollInterval);
          } else if (prediction.status === "failed") {
            setError("Alt text generation failed.");
            setIsLoading(false);
            clearInterval(pollInterval);
          }
        } catch (err) {
          console.error("Polling error:", err);
          setError("Error while fetching result.");
          setIsLoading(false);
          clearInterval(pollInterval);
        }
      }
    };

    if (predictionId) {
      pollInterval = setInterval(pollForResult, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [predictionId]);

  useEffect(() => {
    if (showSnackbar) {
      const timer = setTimeout(() => {
        setShowSnackbar(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSnackbar]);

  return (
    <div className="max-w-md p-6 mx-auto my-10 bg-white rounded-lg shadow-lg">
      <h1 className="mb-4 text-2xl font-bold text-center">
        AI Alt Text Generator
      </h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
      </div>
      <button
        onClick={handleGenerateAltText}
        disabled={isLoading || !imageUrl}
        className={`w-full p-2 text-white rounded ${
          isLoading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
        } transition duration-300 ease-in-out`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-3 text-white animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Generating...
          </span>
        ) : (
          "Generate Alt Text"
        )}
      </button>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      {altText && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Generated Alt Text:</h2>
          <p>{altText}</p>
        </div>
      )}
      {imageUrl && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Image Preview:</h2>
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-auto rounded shadow-md"
          />
        </div>
      )}
      {showSnackbar && (
        <div className="fixed px-4 py-2 text-white transform -translate-x-1/2 bg-green-600 rounded bottom-5 left-1/2">
          Alt text generated successfully!
        </div>
      )}
    </div>
  );
}

export default AltTextGenerator;
