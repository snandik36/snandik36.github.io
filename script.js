const apiKey = "Xc4g6WAxuMwJ9wNwuYaIaLF3TpGeessIGuxQlE0y"; 

document.getElementById("foodForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const query = document.getElementById("foodInput").value.trim();
  const resultDiv = document.getElementById("result");
  if (!query) return;

  resultDiv.textContent = "Loading...";

  try {
    const proxyUrl = "https://corsproxy.io/?";
    const baseUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&requireAllWords=false&api_key=${apiKey}`;
    const searchUrl = proxyUrl + baseUrl;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.foods || searchData.foods.length === 0) {
      resultDiv.textContent = "No food found.";
      return;
    }

    // clear previous results
    resultDiv.innerHTML = "<h2>Top Matches:</h2>";

    for (let food of searchData.foods) {
      const fdcId = food.fdcId;
      const detailsUrl = proxyUrl + `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const foodDetails = await detailsResponse.json();

      // Find protein
      let protein = "Not found";
      // First check foodNutrients
      if (foodDetails.foodNutrients && Array.isArray(foodDetails.foodNutrients)) {
        for (let nutrient of foodDetails.foodNutrients) {
          const name = (nutrient.nutrientName || "").toLowerCase();
          if (name.includes("protein")) {
            protein = `${nutrient.value} ${nutrient.unitName || "g"}`;
            break;
          }
        }
      }
      // If still not found, check labelNutrients
      if (protein === "Not found" && foodDetails.labelNutrients) {
        if (foodDetails.labelNutrients.protein && typeof foodDetails.labelNutrients.protein.value !== "undefined") {
          protein = `${foodDetails.labelNutrients.protein.value} g`;
        }
      }


      // Append result
      const foodItem = document.createElement("div");
      let title = foodDetails.description || "Unnamed Food";
      if (foodDetails.brandName) {
        title = `${foodDetails.brandName} - ${title}`;
      }
      foodItem.innerHTML = `<p><strong>${title}</strong>: ${protein} protein</p>`;
      resultDiv.appendChild(foodItem);
    }

  } catch (error) {
    console.error("Error occurred:", error);
    resultDiv.textContent = `Error: ${error.message}`;
  }
});
