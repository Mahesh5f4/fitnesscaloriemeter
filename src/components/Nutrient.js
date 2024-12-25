import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Nutrient.css";

const NutritionChecker = () => {
  const [food, setFood] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [foodItems, setFoodItems] = useState(
    JSON.parse(localStorage.getItem("foodItems")) || []
  );
  const [weight, setWeight] = useState(localStorage.getItem("weight") || "");
  const [age, setAge] = useState(localStorage.getItem("age") || "");
  const [goal, setGoal] = useState(localStorage.getItem("goal") || "bulk");
  const [caloriesRequired, setCaloriesRequired] = useState(
    JSON.parse(localStorage.getItem("caloriesRequired")) || 0
  );
  const [proteinRequired, setProteinRequired] = useState(
    JSON.parse(localStorage.getItem("proteinRequired")) || 0
  );
  const [remainingCalories, setRemainingCalories] = useState(
    JSON.parse(localStorage.getItem("remainingCalories")) || caloriesRequired
  );
  const [remainingProtein, setRemainingProtein] = useState(
    JSON.parse(localStorage.getItem("remainingProtein")) || proteinRequired
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("foodItems", JSON.stringify(foodItems));
    localStorage.setItem("weight", weight);
    localStorage.setItem("age", age);
    localStorage.setItem("goal", goal);
    localStorage.setItem("caloriesRequired", JSON.stringify(caloriesRequired));
    localStorage.setItem("proteinRequired", JSON.stringify(proteinRequired));
    localStorage.setItem(
      "remainingCalories",
      JSON.stringify(remainingCalories)
    );
    localStorage.setItem(
      "remainingProtein",
      JSON.stringify(remainingProtein)
    );
  }, [
    foodItems,
    weight,
    age,
    goal,
    caloriesRequired,
    proteinRequired,
    remainingCalories,
    remainingProtein,
  ]);

  const calculateRequirements = () => {
    if (weight && age) {
      const bmr = 10 * parseFloat(weight) + 6.25 * 175 - 5 * parseInt(age) + 5; // Assuming average height of 175cm
      const proteinIntake = parseFloat(weight) * (goal === "bulk" ? 2.2 : 1.6);

      const calories = goal === "bulk" ? bmr + 500 : bmr - 500;
      setCaloriesRequired(calories);
      setProteinRequired(proteinIntake);
      setRemainingCalories(calories);
      setRemainingProtein(proteinIntake);
    }
  };

  useEffect(() => {
    calculateRequirements();
  }, [weight, age, goal]);

  const fetchNutritionData = async () => {
    setLoading(true);
    try {
      const APP_ID = "bc209fd2"; // Your Edamam App ID
      const APP_KEY = "4f0f54a1d30919e2103c1b16d4908227"; // Your Edamam API Key

      const response = await axios.get(
        `https://api.edamam.com/api/nutrition-data`,
        {
          params: {
            app_id: APP_ID,
            app_key: APP_KEY,
            ingr: food,
          },
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setResult(null);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (food) fetchNutritionData();
  };

  const addFoodToTable = () => {
    if (food.trim() === "" || !result) {
      alert("Please enter a food and fetch its nutrition first.");
      return;
    }

    const newFoodItem = {
      name: food,
      calories: result.calories,
      protein: result.totalNutrients.PROCNT?.quantity || 0,
      carbs: result.totalNutrients.CHOCDF?.quantity || 0,
      fats: result.totalNutrients.FAT?.quantity || 0,
    };

    setFoodItems([...foodItems, newFoodItem]);

    const updatedCalories = remainingCalories - newFoodItem.calories;
    const updatedProtein = remainingProtein - newFoodItem.protein;

    setRemainingCalories(updatedCalories > 0 ? updatedCalories : 0);
    setRemainingProtein(updatedProtein > 0 ? updatedProtein : 0);

    if (updatedCalories <= 0 && updatedProtein <= 0) {
      setMessage("Intake Completed");
    } else {
      setMessage("");
    }

    setFood("");
    setResult(null);
  };

  const handleGoalChange = (e) => {
    setGoal(e.target.value);
  };

  const resetData = () => {
    setFoodItems([]);
    setWeight("");
    setAge("");
    setGoal("bulk");
    setCaloriesRequired(0);
    setProteinRequired(0);
    setRemainingCalories(0);
    setRemainingProtein(0);
    setMessage("");
    localStorage.clear();
  };

  useEffect(() => {
    const resetAtMidnight = () => {
      const now = new Date();
      const msUntilMidnight = new Date(now).setHours(24, 0, 0, 0) - now;
      setTimeout(() => {
        resetData();
      }, msUntilMidnight);
    };

    resetAtMidnight();
  }, []);

  return (
    <div className="nutrition-checker">
      <h1>Food Nutrition Tracker</h1>

      <div className="user-info">
        <input
          type="number"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <select onChange={handleGoalChange} value={goal}>
          <option value="bulk">Bulk</option>
          <option value="cut">Cut</option>
        </select>
      </div>

      <h2>Daily Nutrient Requirements</h2>
      <p>Calories: {caloriesRequired}</p>
      <p>Protein: {proteinRequired} g</p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter food (e.g., 1 apple)"
          value={food}
          onChange={(e) => setFood(e.target.value)}
        />
        <button type="submit">Check Nutrition</button>
      </form>

      {loading && <p>Loading...</p>}

      {result && (
        <div className="nutrition-details">
          <p>
            <strong>Calories:</strong> {result.calories || "N/A"}
          </p>
          <p>
            <strong>Protein:</strong>{" "}
            {result.totalNutrients.PROCNT?.quantity?.toFixed(1) || 0} g
          </p>
          <p>
            <strong>Carbs:</strong>{" "}
            {result.totalNutrients.CHOCDF?.quantity?.toFixed(1) || 0} g
          </p>
          <p>
            <strong>Fats:</strong>{" "}
            {result.totalNutrients.FAT?.quantity?.toFixed(1) || 0} g
          </p>
        </div>
      )}

      <button onClick={addFoodToTable}>Add Food</button>

      <div className="food-table">
        <h2>Food Intake</h2>
        <table>
          <thead>
            <tr>
              <th>Food</th>
              <th>Calories</th>
              <th>Protein (g)</th>
            </tr>
          </thead>
          <tbody>
            {foodItems.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.calories}</td>
                <td>{item.protein.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="remaining-nutrients">
        <p>Remaining Calories: {remainingCalories}</p>
        <p>Remaining Protein: {remainingProtein} g</p>
      </div>

      {message && <p>{message}</p>}

      <button onClick={resetData}>Reset</button>

      <footer className="app-footer">
        <p>
          Developed by <strong>Mahesh</strong> | Contact : 
          <a href="mailto:mahesh20104@gmail.com">mahesh20104@gmail.com</a>
        </p>
      </footer>
    </div>
  );
};

export default NutritionChecker;
