const apiKey = "Xc4g6WAxuMwJ9wNwuYaIaLF3TpGeessIGuxQlE0y"; // <-- put your USDA API key here

document.getElementById("foodForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const query = document.getElementById("foodInput").value.trim();
  if (!query) return;

  const resultDiv = document.getElementById("result");
  resultDiv.textContent = "Loading...";

  try {
    // Step 1: Search for the food
    const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=1&requireAllWords=false&api_key=${apiKey}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.foods || searchData.foods.length === 0) {
      resultDiv.textContent = "No food found.";
      return;
    }

    const food = searchData.foods[0];
    const fdcId = food.fdcId;

    // Step 2: Get full details by fdcId
    const detailsUrl = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    const foodDetails = await detailsResponse.json();

    // Step 3: Extract protein info
    let protein = "Not found";
    for (let nutrient of foodDetails.foodNutrients) {
      if (nutrient.nutrientName.toLowerCase().includes("protein")) {
        protein = `${nutrient.value} ${nutrient.unitName}`;
        break;
      }
    }

    resultDiv.innerHTML = `
      <h2>Result:</h2>
      <p><strong>Name:</strong> ${foodDetails.description}</p>
      <p><strong>Protein:</strong> ${protein}</p>
    `;

  } catch (error) {
    console.error("Error:", error);
    resultDiv.textContent = `Error: ${error.message}`;
  }
});
