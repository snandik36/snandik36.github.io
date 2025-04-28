const apiKey = "YOUR_API_KEY_HERE"; // <-- Insert your USDA API key

const prescribedDiet = {
  maxCarbs: 20,   // grams
  minProtein: 25, // grams
  maxSodium: 300  // milligrams
};

document.getElementById("foodForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  const query = document.getElementById("foodInput").value.trim();
  if (query === "") return;

  const foods = await searchFoods(query);
  if (foods && foods.length > 0) {
    displaySearchResults(foods);
  } else {
    displayResult({ name: query, finalScore: "N/A", grade: "Food not found" });
  }
});

// Search USDA API for multiple foods
async function searchFoods(query) {
  const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${apiKey}`;
  try {
    const response = await fetch(searchUrl);
    const data = await response.json();
    if (data.foods && data.foods.length > 0) {
      return data.foods; // array of top 5 foods
    }
    return null;
  } catch (error) {
    console.error("Error fetching food data:", error);
    return null;
  }
}

// When user clicks a food, fetch full nutrients and grade it
async function selectFood(fdcId, description) {
  const foodUrl = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`;
  try {
    const foodResponse = await fetch(foodUrl);
    const foodData = await foodResponse.json();

    const foodNutrients = extractNutrients(foodData);
    if (foodNutrients) {
      const result = calculateFoodScore(foodNutrients, prescribedDiet);
      displayResult(result);
    }
  } catch (error) {
    console.error("Error fetching selected food:", error);
  }
}

// Extract nutrients we care about
function extractNutrients(food) {
  let nutrients = {
    name: food.description,
    carbs: 0,
    protein: 0,
    sodium: 0
  };

  food.foodNutrients.forEach(nutrient => {
    const name = nutrient.nutrientName.toLowerCase();
    if (name.includes("carbohydrate")) {
      nutrients.carbs = nutrient.value;
    } else if (name.includes("protein")) {
      nutrients.protein = nutrient.value;
    } else if (name.includes("sodium")) {
      nutrients.sodium = nutrient.value;
    }
  });

  return nutrients;
}

// Calculate score
function calculateSubScore(actual, target, type = "max") {
  if (type === "max") {
    return actual <= target ? 100 : Math.max(0, 100 - ((actual - target) / target) * 100);
  } else if (type === "min") {
    return actual >= target ? 100 : Math.max(0, (actual / target) * 100);
  }
  return 0;
}

function calculateFoodScore(food, diet) {
  let scores = [];
  scores.push(calculateSubScore(food.carbs, diet.maxCarbs, "max"));
  scores.push(calculateSubScore(food.protein, diet.minProtein, "min"));
  scores.push(calculateSubScore(food.sodium, diet.maxSodium, "max"));

  const finalScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  let grade;
  if (finalScore >= 90) grade = "A";
  else if (finalScore >= 80) grade = "B";
  else if (finalScore >= 70) grade = "C";
  else if (finalScore >= 60) grade = "D";
  else grade = "F";

  return {
    name: food.name,
    finalScore: finalScore.toFixed(1) + "%",
    grade: grade
  };
}

// Display the top search results
function displaySearchResults(foods) {
  const searchResultsDiv = document.getElementById("searchResults");
  searchResultsDiv.innerHTML = "<h2>Select a food:</h2>";

  foods.forEach(food => {
    const foodBtn = document.createElement("button");
    foodBtn.textContent = food.description;
    foodBtn.style.display = "block";
    foodBtn.style.margin = "5px";
    foodBtn.onclick = () => selectFood(food.fdcId, food.description);
    searchResultsDiv.appendChild(foodBtn);
  });

  // Clear previous result
  document.getElementById("result").innerHTML = "";
}

// Show final grade
function displayResult(result) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = `
    <h2>Results for: ${result.name}</h2>
    <p>Score: ${result.finalScore}</p>
    <p>Grade: <strong>${result.grade}</strong></p>
  `;

  // Clear search results after selection
  document.getElementById("searchResults").innerHTML = "";
}
