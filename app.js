const weatherform = document.querySelector(".weatherForm");
const cityInput = document.querySelector("#cityInput");
const card = document.querySelector(".main-card");
const apikey = "c957020a39e940ada8894b44a81db879";
const fiveDayTrack = document.getElementById("fiveDayTrack");
const hourlySection = document.querySelector(".hourly-slider-section");
const timeSlider = document.getElementById("timeSlider");
const sliderLabels = document.getElementById("sliderLabels");

const emptyfieldBtn = document.getElementById('EmptyField');
if (emptyfieldBtn) {
    emptyfieldBtn.addEventListener('click', () => {
        cityInput.value = " ";
    });
    
}
// Store hourly data globally
let currentHourlyData = [];
let currentCityName = "";

weatherform.addEventListener("submit", async (event) => {
    event.preventDefault();  
    const city = cityInput.value.trim();
    
    if (!city) {
        displayError("❌ Please enter a city name");
        return;
    }
    
    await searchWeather(city);
});

async function getWeatherData(city) {  
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apikey}&units=metric`
        );
        
        if (!response.ok) {
            if (response.status === 404) throw new Error(`City "${city}" not found`);
            if (response.status === 401) throw new Error("Invalid API key");
            throw new Error("Weather service unavailable");
        }
        
        const data = await response.json();
        currentCityName = data.name;
        displayWeatherInfo(data);
        return data;
        
    } catch (error) {
        displayError(`⚠️ ${error.message}`);
        // Error handling 
        if (hourlySection) hourlySection.style.display = "none";
    }
}

async function getfiveday(city) {  
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apikey}&units=metric`);
    
        if (!response.ok) {
            if (response.status === 404) throw new Error(`Forecast for "${city}" not available`);
            throw new Error("Forecast service unavailable");
        }
        
        const forecastData = await response.json();  
        console.log("5-DAY FORECAST:", forecastData);
        
        setupHourlySlider(forecastData);
        displayFiveDayScroller(forecastData);
        
        return forecastData;
        
    } catch (error) {
        console.log("Forecast error:", error);
        if (fiveDayTrack) fiveDayTrack.innerHTML = `<div class="errorDisplay">⚠️ ${error.message}</div>`;
        if (hourlySection) hourlySection.style.display = "none";
    }
}

// ============ HOURLY SLIDER SETUP ============
function setupHourlySlider(forecastData) {
    const today = new Date().toISOString().split("T")[0];
    const hourlyForecasts = [];
    
    for (let item of forecastData.list) {
        const date = item.dt_txt.split(" ")[0];
        if (date === today) {
            hourlyForecasts.push(item);
        }
        if (hourlyForecasts.length === 8) break;
    }
    if (hourlyForecasts.length === 0) {
        hourlySection.style.display = "none";
        return;
    }
    
    currentHourlyData = hourlyForecasts;
    hourlySection.style.display = "block";
    
    // Setup slider
    const maxIndex = hourlyForecasts.length - 1;
    timeSlider.max = maxIndex;
    timeSlider.value = 0;
    
    // time labels
    sliderLabels.innerHTML = "";
    hourlyForecasts.forEach((forecast, index) => {
        const time = forecast.dt_txt.split(" ")[1].slice(0, 5);
        const label = document.createElement("span");
        label.textContent = time;
        label.style.cursor = "pointer";
        label.style.fontSize = "11px";
        label.style.padding = "5px";
        label.onclick = ()=> {
            timeSlider.value = index;
            updateWeatherFromSlider(index);
        };
        sliderLabels.appendChild(label);
    });
    
    // Add slider event listener
    timeSlider.oninput = (e) => {
        const index = parseInt(e.target.value);
        updateWeatherFromSlider(index);
    };
    
    // Update slider
    const hint = document.getElementById("sliderHint");
    if (hint) {
     hint.innerHTML = `📅 ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
    }
    
    updateWeatherFromSlider(0);
}

function updateWeatherFromSlider(index) {
    if (!currentHourlyData[index]) return;
    
    const forecast = currentHourlyData[index];
    const time = forecast.dt_txt.split(" ")[1].slice(0, 5);
    const weatherDesc = forecast.weather[0].description;
    const weatherId = forecast.weather[0].id;
    const temp = Math.round(forecast.main.temp);
    const humidity = forecast.main.humidity;
    const windSpeed = forecast.wind.speed;
    const feelsLike = Math.round(forecast.main.feels_like);
    const pressure = forecast.main.pressure;
    
    card.style.display = "block";
    card.innerHTML =
    `
        <div class="weather-top">
            <div class="city-section">
                <div class="cityDisplay">${currentCityName}</div>
                
                <div class="weatherDesc">${weatherDesc} at ${time}</div>

            </div>
            <div class="temp-section">
                <div class="weatheremoji">${getWeatherEmoji(weatherId)}</div>
                <div class="tempDisplay">${temp}°C</div>
            </div>
        </div>
        <div class="weather-bottom">
         <div class="detail-card"><div class="detail-icon">💧</div><div class="detail-label">Humidity</div><div class="detail-value">${humidity}<span class="detail-unit">%</span></div></div>
         <div class="detail-card"><div class="detail-icon">💨</div><div class="detail-label">Wind Speed</div><div class="detail-value">${windSpeed}<span class="detail-unit">km/h</span></div></div>
         <div class="detail-card"><div class="detail-icon">🌡️</div><div class="detail-label">Feels Like</div><div class="detail-value">${feelsLike}<span class="detail-unit">°C</span></div></div>
         <div class="detail-card"><div class="detail-icon">📊</div><div class="detail-label">Pressure</div><div class="detail-value">${pressure}<span class="detail-unit">hPa</span></div></div>
        </div>
    `;
}

let fiveDaySlideIndex = 0;
let fiveDayCardsPerView = 3;

function updateCardsPerView() {
    if (window.innerWidth < 550) {
        fiveDayCardsPerView = 1;
    } else if (window.innerWidth < 768) {
        fiveDayCardsPerView = 2;
    } else {
        fiveDayCardsPerView = 3;
    }
}

function scrollFiveDay(direction) {
    if (!fiveDayTrack) return;
    
    const cards = document.querySelectorAll('.five-day-card-slide');
    const totalCards = cards.length;
    const maxIndex = Math.max(0, totalCards - fiveDayCardsPerView);
    
    fiveDaySlideIndex += direction;
    if (fiveDaySlideIndex < 0) fiveDaySlideIndex = 0;
    if (fiveDaySlideIndex > maxIndex) fiveDaySlideIndex = maxIndex;
    
    const cardWidth = cards[0]?.offsetWidth + 20 || 220;
    fiveDayTrack.style.transform = `translateX(-${fiveDaySlideIndex * cardWidth}px)`;
}

function resetFiveDayScroll() {
    fiveDaySlideIndex = 0;
    if (fiveDayTrack) fiveDayTrack.style.transform = 'translateX(0px)';
}

// ============ DISPLAY CURRENT WEATHER ============
function displayWeatherInfo(data) {
    const weatherDesc = data.weather[0].description;
    const weatherId = data.weather[0].id;
    const temp = Math.round(data.main.temp);
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const feelsLike = Math.round(data.main.feels_like);
    const pressure = data.main.pressure;
    
    card.style.display = "block";
    card.innerHTML = `
        <div class="weather-top">
            <div class="city-section">
                <div class="cityDisplay">${data.name}</div>
                <div class="weatherDesc">${weatherDesc} (Current)</div>
            </div>
            <div class="temp-section">
                <div class="weatheremoji">${getWeatherEmoji(weatherId)}</div>
                <div class="tempDisplay">${temp}°C</div>
            </div>
        </div>
        <div class="weather-bottom">
            <div class="detail-card"><div class="detail-icon">💧</div><div class="detail-label">Humidity
            </div><div class="detail-value">${humidity}<span class="detail-unit">%</span></div></div>
            <div class="detail-card"><div class="detail-icon">💨</div><div class="detail-label">Wind Speed</div><div class="detail-value">${windSpeed}<span class="detail-unit">km/h</span></div></div>
            <div class="detail-card"><div class="detail-icon">🌡️</div><div class="detail-label">Feels Like</div><div class="detail-value">${feelsLike}<span class="detail-unit">°C</span></div></div>
            <div class="detail-card"><div class="detail-icon">📊</div><div class="detail-label">Pressure</div><div class="detail-value">${pressure}<span class="detail-unit">hPa</span></div></div>
        </div>
    `;
}

function getWeatherEmoji(weatherId) {
    if (weatherId >= 200 && weatherId < 300) return "⛈️";
    if (weatherId >= 300 && weatherId < 500) return "🌧️";
    if (weatherId >= 500 && weatherId < 600) return "🌧️";
    if (weatherId >= 600 && weatherId < 700) return "❄️";
    if (weatherId >= 700 && weatherId < 800) return "🌫️";
    if (weatherId === 800) return "☀️";
    if (weatherId > 800) return "☁️";
    return "🌡️";
}

function displayError(message) {
    card.style.display = "block";
    card.innerHTML = `<div class="errorDisplay">${message}</div>`;
    if (hourlySection) hourlySection.style.display = "none";
    if (fiveDayTrack) fiveDayTrack.innerHTML = '';
}


// ======== LOCALSTORAGE FUNCTIONS ========
function savetoLocalStorage(city) {
    let searches = JSON.parse(localStorage.getItem('weatherSearches') || '[]');
    searches = searches.filter(item => item.toLowerCase() !== city.toLowerCase());
    searches.unshift(city);
    searches = searches.slice(0, 10);
    localStorage.setItem('weatherSearches', JSON.stringify(searches));
    displaySearchHistory();
}

function loadSearchHistory() {
    return JSON.parse(localStorage.getItem('weatherSearches') || '[]');
}

function displaySearchHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    const searches = loadSearchHistory();
    historyList.innerHTML = '';
    if (searches.length === 0) {
        historyList.innerHTML = '<li style="color: #999;">No searches yet</li>';
        return;
    }
    searches.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.addEventListener('click', () => {
            cityInput.value = city;
            searchWeather(city);
        });
        historyList.appendChild(li);
    });
}

function clearSearchHistory() {
    localStorage.removeItem('weatherSearches');
    displaySearchHistory();
}

async function searchWeather(city) {
    if (!city) return;
    await savetoLocalStorage(city);
    await getWeatherData(city);
    await getfiveday(city);
}

// ============ EVENT LISTENERS ============
const clearHistoryBtn = document.getElementById('clearHistory');
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => clearSearchHistory());
}

const pastCityBtn = document.getElementById('past-city');
if (pastCityBtn) {
    pastCityBtn.addEventListener('click', () => {
        const searches = loadSearchHistory();
        if (searches.length > 0) {
            cityInput.value = searches[0];
            searchWeather(searches[0]);
        } else {
            displayError("⚠️ No past searches found. Search a city first!");
        }
    });
}



document.querySelector('.prev-five')?.addEventListener('click', () => scrollFiveDay(-1));
document.querySelector('.next-five')?.addEventListener('click', () => scrollFiveDay(1));

document.addEventListener('DOMContentLoaded', () => {
    displaySearchHistory();
    updateCardsPerView();
    window.addEventListener('resize', () => {
        updateCardsPerView();
        resetFiveDayScroll();
    });
    
    // const searches = loadSearchHistory();
    // if (searches.length > 0) {
    //     cityInput.placeholder = `Last searched: ${searches[0]}`;
    // }
});
// Hourly navigation inside 5-day cards
function displayFiveDayScroller(forecastData) {
    if (!fiveDayTrack) return;
    
    const today = new Date().toISOString().split("T")[0];
    const forecastsByDay = {};
    
    for (let item of forecastData.list) {
        const date = item.dt_txt.split(" ")[0];
        if (date <= today) continue;
        
        if (!forecastsByDay[date]) {
            forecastsByDay[date] = [];
        }
        forecastsByDay[date].push(item);
    }
    // the ones that controls how many days to display
    const dates = Object.keys(forecastsByDay).slice(0, 5);
    
    if (dates.length === 0) {
        fiveDayTrack.innerHTML = '<div class="errorDisplay">⚠️ No forecast data available</div>';
        return;
    }
    
    fiveDayTrack.innerHTML = '';
    
    dates.forEach(date => {
        const forecasts = forecastsByDay[date];
        const formattedDate = new Date(date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const forecastCard = document.createElement('div');
        forecastCard.classList.add('five-day-card-slide');
        
        // Store hourly data for this card
        forecastCard.dataset.hourlyData = JSON.stringify(forecasts);
        forecastCard.dataset.currentHourIndex = "0";

        const initialForecast = forecasts[0];
        
        forecastCard.innerHTML = `
            <div class="five-day-date">${formattedDate}</div>
            
            <!-- Hourly Navigation inside card -->
            <div class="hour-nav-inside">
                <button class="hour-prev-card">◀</button>
                <span class="current-hour-time">${initialForecast.dt_txt.split(" ")[1].slice(0, 5)}</span>
                <button class="hour-next-card">▶</button>
            </div>
       
            <div class="five-day-hourly-details">
            <div class="five-day-emoji">${getWeatherEmoji(initialForecast.weather[0].id)}</div>
            <div class="five-day-temp">${Math.round(initialForecast.main.temp)}°C</div>
            <div class="five-day-desc">${initialForecast.weather[0].description}</div>
            <div class="five-day-humidity">💧 ${initialForecast.main.humidity}%</div>
            <div class="five-day-wind">💨 ${initialForecast.wind.speed} km/h</div>
            </div>
        `;
        
        fiveDayTrack.appendChild(forecastCard);
    });
    
    // hourly navigation to each card
    document.querySelectorAll('.five-day-card-slide').forEach(card => {
        const hourlyData = JSON.parse(card.dataset.hourlyData);
        let currentIndex = 0;
        
        const prevBtn = card.querySelector('.hour-prev-card');
        const nextBtn = card.querySelector('.hour-next-card');
        const timeSpan = card.querySelector('.current-hour-time');
        const detailsDiv = card.querySelector('.five-day-hourly-details');
        
        function updateHourlyDisplay() {
            const forecast = hourlyData[currentIndex];
            const time = forecast.dt_txt.split(" ")[1].slice(0, 5);
            timeSpan.textContent = time;
            
            detailsDiv.innerHTML = `
                <div class="five-day-emoji">${getWeatherEmoji(forecast.weather[0].id)}</div>
            <div class="five-day-temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="five-day-desc">${forecast.weather[0].description}</div>
                <div class="five-day-humidity">💧 ${forecast.main.humidity}%</div>
                <div class="five-day-wind">💨 ${forecast.wind.speed} km/h</div>
            `;
        }
        
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateHourlyDisplay();
            }
        });
        
        nextBtn.addEventListener('click', () => {
            if (currentIndex < hourlyData.length - 1) {
                currentIndex++;
                updateHourlyDisplay();
            }
        });
    });
    
    resetFiveDayScroll();
}