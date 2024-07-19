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

    let currentFoodInfo = {};

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
                        foodInfo.style.display = foodInfo.style.display === 'none' ? 'block' : 'none';
                        showInfoButton.textContent = foodInfo.style.display === 'none' ? 'Show Info' : 'Hide Info';
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

    mealForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const mealName = document.getElementById('meal-name').value;
        const foodQuery = document.getElementById('meal-info').value;

        const foodItems = await fetchFoodInfo(foodQuery);
        const foods = foodItems.map(item => ({
            name: item.name,
            calories: roundToDecimal(item.calories),
            fat_total_g: roundToDecimal(item.fat_total_g),
            fat_saturated_g: roundToDecimal(item.fat_saturated_g),
            protein_g: roundToDecimal(item.protein_g),
            carbohydrates_total_g: roundToDecimal(item.carbohydrates_total_g),
            sugar_g: roundToDecimal(item.sugar_g),
            fiber_g: roundToDecimal(item.fiber_g),
            sodium_mg: roundToDecimal(item.sodium_mg),
            potassium_mg: roundToDecimal(item.potassium_mg),
            cholesterol_mg: roundToDecimal(item.cholesterol_mg)
        }));

        const meal = {
            name: mealName,
            foods: foods,
            calories: roundToDecimal(foods.reduce((totalCal, food) => totalCal + food.calories, 0)),
            timestamp: new Date().toISOString()
        };

        const index = saveMeal(meal);
        addMealToDom(meal, index);
        updateTotalCalories();
        mealForm.reset();
    });

    showInfoButton.addEventListener('click', async () => {
        const foodQuery = document.getElementById('meal-info').value;
        const foodItems = await fetchFoodInfo(foodQuery);

        if (foodItems.length > 0) {
            foodInfoDiv.style.display = foodInfoDiv.style.display === 'none' ? 'block' : 'none';
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
                    detailedInfoDiv.style.display = detailedInfoDiv.style.display === 'none' ? 'block' : 'none';
                    showMoreInfoButton.textContent = detailedInfoDiv.style.display === 'none' ? 'Show More Info' : 'Hide Info';
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
