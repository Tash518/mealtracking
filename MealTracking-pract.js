document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'C7Oa4TY1wUXVNkR4q65DuQ==gRK9uz0gDqdhAq19';
    const url = 'https://api.calorieninjas.com/v1/nutrition';

    const mealForm = document.getElementById('meal-form');
    const mealList = document.getElementById('meal-list');
    const totalCaloriesElement = document.getElementById('total-calories');
    const foodInfoDiv = document.getElementById('food-info');
    const showInfoButton = document.getElementById('show-info');
    const mealDateInput = document.getElementById('meal-date');
    const selectedDateElement = document.getElementById('selected-date');
    const foodChartDiv = document.getElementById('food-chart');
    const nutritionChartCanvas = document.getElementById('nutrition-chart').getContext('2d');

    let chartInstance = null; // To hold the chart instance

    const roundToDecimal = (value, decimals = 1) => {
        return Math.round(value * 10 ** decimals) / 10 ** decimals;
    };

    const updateTotalCalories = () => {
        let totalCalories = 0;
        const meals = JSON.parse(localStorage.getItem('meals')) || [];
        meals.forEach(meal => {
            totalCalories += roundToDecimal(meal.calories);
        });
        totalCaloriesElement.textContent = roundToDecimal(totalCalories);
    };

    const addMealToDom = (meal, index) => {
        const mealItem = document.createElement('li');
        mealItem.innerHTML = `
            ${meal.name} - ${roundToDecimal(meal.calories)} calories :: time- ${new Date(meal.timestamp).toLocaleTimeString()} 
            <button class="expand-meal">Expand</button>
            <button class="remove-meal" data-index="${index}">X</button>
            <ul class="food-list" style="display: none;"></ul>
        `;
        mealList.appendChild(mealItem);

        const expandButton = mealItem.querySelector('.expand-meal');
        const removeButton = mealItem.querySelector('.remove-meal');
        const foodList = mealItem.querySelector('.food-list');

        expandButton.addEventListener('click', () => {
            if (foodList.style.display === 'none') {
                foodList.style.display = 'block';
                foodList.innerHTML = ''; // Clear existing food list to avoid duplicates
                meal.foods.forEach(food => {
                    const foodItem = document.createElement('li');
                    foodItem.innerHTML = `
                        ${food.name} - ${roundToDecimal(food.calories)} calories
                        <button class="show-info">Show Info</button>
                        <div class="food-info" style="display: none;">
                            <strong>Total Fat:</strong> ${roundToDecimal(food.fat_total_g)} g<br>
                            <strong>Saturated Fat:</strong> ${roundToDecimal(food.fat_saturated_g)} g<br>
                            <strong>Protein:</strong> ${roundToDecimal(food.protein_g)} g<br>
                            <strong>Carbohydrates:</strong> ${roundToDecimal(food.carbohydrates_total_g)} g<br>
                            <strong>Sugar:</strong> ${roundToDecimal(food.sugar_g)} g<br>
                            <strong>Fiber:</strong> ${roundToDecimal(food.fiber_g)} g<br>
                            <strong>Sodium:</strong> ${roundToDecimal(food.sodium_mg)} mg<br>
                            <strong>Potassium:</strong> ${roundToDecimal(food.potassium_mg)} mg<br>
                            <strong>Cholesterol:</strong> ${roundToDecimal(food.cholesterol_mg)} mg<br>
                        </div>
                    `;
                    foodList.appendChild(foodItem);

                    const showInfoButton = foodItem.querySelector('.show-info');
                    const foodInfo = foodItem.querySelector('.food-info');
                    showInfoButton.addEventListener('click', () => {
                        if (foodInfo.style.display === 'none') {
                            foodInfo.style.display = 'block';
                            showInfoButton.textContent = 'Hide Info';
                            renderChart(food); // Render chart with food information
                        } else {
                            foodInfo.style.display = 'none';
                            showInfoButton.textContent = 'Show Info';
                            foodChartDiv.style.display = 'none'; // Hide chart
                            if (chartInstance) {
                                chartInstance.destroy(); // Destroy previous chart instance
                                chartInstance = null;
                            }
                        }
                    });
                });
            } else {
                foodList.style.display = 'none';
            }
        });

        removeButton.addEventListener('click', () => {
            removeMeal(index);
        });
    };

    const removeMeal = (index) => {
        let meals = JSON.parse(localStorage.getItem('meals')) || [];
        meals = meals.filter((_, i) => i !== index);
        localStorage.setItem('meals', JSON.stringify(meals));
        loadMeals(mealDateInput.value); // Reload meals for the current date
    };

    const saveMeal = (meal) => {
        const meals = JSON.parse(localStorage.getItem('meals')) || [];
        meals.push(meal);
        localStorage.setItem('meals', JSON.stringify(meals));
        return meals.length - 1;
    };

    const fetchFoodInfo = async (foodQuery) => {
        try {
            const response = await fetch(`${url}?query=${foodQuery}`, {
                method: 'GET',
                headers: {
                    'X-Api-Key': apiKey
                }
            });
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            return [];
        }
    };

    const loadMeals = (date) => {
        const meals = JSON.parse(localStorage.getItem('meals')) || [];
        mealList.innerHTML = ''; // Clear existing meals
        const filteredMeals = meals.filter(meal => meal.timestamp.startsWith(date));
        filteredMeals.forEach((meal, index) => {
            addMealToDom(meal, index);
        });
        updateTotalCalories();
        selectedDateElement.textContent = date;
    };

    const renderChart = (food) => {
        foodChartDiv.style.display = 'block';
        
        // Clear the previous chart if it exists
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        const data = {
            labels: ['Total Fat', 'Saturated Fat', 'Protein', 'Carbohydrates', 'Sugar', 'Fiber', 'Sodium', 'Potassium', 'Cholesterol'],
            datasets: [{
                label: food.name,
                data: [
                    food.fat_total_g,
                    food.fat_saturated_g,
                    food.protein_g,
                    food.carbohydrates_total_g,
                    food.sugar_g,
                    food.fiber_g,
                    food.sodium_mg / 1000, // Convert mg to g for better readability
                    food.potassium_mg / 1000, // Convert mg to g for better readability
                    food.cholesterol_mg / 1000 // Convert mg to g for better readability
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                    'rgba(199, 199, 199, 0.2)',
                    'rgba(0, 255, 0, 0.2)',
                    'rgba(255, 0, 0, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                    'rgba(0, 255, 0, 1)',
                    'rgba(255, 0, 0, 1)'
                ],
                borderWidth: 1
            }]
        };

        chartInstance = new Chart(nutritionChartCanvas, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    };

    showInfoButton.addEventListener('click', async () => {
        const foodQuery = document.getElementById('meal-info').value;
        const foodItems = await fetchFoodInfo(foodQuery);

        if (foodItems.length > 0) {
            foodInfoDiv.style.display = 'block';
            foodInfoDiv.innerHTML = '';

            foodItems.forEach(food => {
                const foodInfoItem = document.createElement('div');
                foodInfoItem.innerHTML = `
                    <strong>Food Item:</strong> ${food.name}<br>
                    <strong>Calories:</strong> ${roundToDecimal(food.calories)} kcal<br>
                    <button class="show-more-info">Show More Info</button>
                    <div class="detailed-info" style="display: none;">
                        <strong>Total Fat:</strong> ${roundToDecimal(food.fat_total_g)} g<br>
                        <strong>Saturated Fat:</strong> ${roundToDecimal(food.fat_saturated_g)} g<br>
                        <strong>Protein:</strong> ${roundToDecimal(food.protein_g)} g<br>
                        <strong>Carbohydrates:</strong> ${roundToDecimal(food.carbohydrates_total_g)} g<br>
                        <strong>Sugar:</strong> ${roundToDecimal(food.sugar_g)} g<br>
                        <strong>Fiber:</strong> ${roundToDecimal(food.fiber_g)} g<br>
                        <strong>Sodium:</strong> ${roundToDecimal(food.sodium_mg)} mg<br>
                        <strong>Potassium:</strong> ${roundToDecimal(food.potassium_mg)} mg<br>
                        <strong>Cholesterol:</strong> ${roundToDecimal(food.cholesterol_mg)} mg<br>
                    </div>
                `;
                foodInfoDiv.appendChild(foodInfoItem);

                const showMoreInfoButton = foodInfoItem.querySelector('.show-more-info');
                const detailedInfoDiv = foodInfoItem.querySelector('.detailed-info');

                showMoreInfoButton.addEventListener('click', () => {
                    if (detailedInfoDiv.style.display === 'none') {
                        detailedInfoDiv.style.display = 'block';
                        showMoreInfoButton.textContent = 'Hide Info';
                        renderChart(food); // Render chart with food information
                    } else {
                        detailedInfoDiv.style.display = 'none';
                        showMoreInfoButton.textContent = 'Show More Info';
                        foodChartDiv.style.display = 'none'; // Hide chart
                        if (chartInstance) {
                            chartInstance.destroy(); // Destroy previous chart instance
                            chartInstance = null;
                        }
                    }
                });
            });
        } else {
            foodInfoDiv.style.display = 'none';
            foodInfoDiv.innerHTML = 'No information available for this food item.';
        }
    });

    mealDateInput.addEventListener('input', (event) => {
        const selectedDate = event.target.value;
        loadMeals(selectedDate);
    });

    // Initialize with current date
    const currentDate = new Date().toISOString().slice(0, 10);
    mealDateInput.value = currentDate;
    loadMeals(currentDate);
});
