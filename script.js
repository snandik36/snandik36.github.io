console.log("Script loaded!");

const apiKey = "Xc4g6WAxuMwJ9wNwuYaIaLF3TpGeessIGuxQlE0y";

const prescribedDiet = {
  maxCarbs: 20,   // grams
  minProtein: 25, // grams
  maxSodium: 300  // milligrams
};

document.getElementById("foodForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  const query = document.getElementById("foodInput").value.trim();
  if (query === "") return;

  const foodData = await searchFood(query);
  if (foodData) {
    const result = calculateFoodScore(foodData, prescribedDiet);
    displayResult(result);
  } else {
    displayResult({ name: query, finalScore: "N/A", grade: "Food not found" });
  }
});

// Search for food using USDA API (properly with fdcId)
async function searchFoods(query) {
  const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${apiKey}`;
  console.log("Searching URL:", searchUrl); // Debug

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error("HTTP Error:", response.status);
      return null;
    }
    const data = await response.json();
    console.log("Food search data:", data); // Debug

    if (data.foods && data.foods.length > 0) {
      return data.foods; // Return array
    }
    console.warn("No foods found in USDA response");
    return null;
  } catch (error) {
    console.error("Error fetching food data:", error);
    return null;
  }
}

// Extract needed nutrients
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

// Calculate the food score
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

// Display result in HTML
function displayResult(result) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = `
    <h2>Results for: ${result.name}</h2>
    <p>Score: ${result.finalScore}</p>
    <p>Grade: <strong>${result.grade}</strong></p>
  `;
}
