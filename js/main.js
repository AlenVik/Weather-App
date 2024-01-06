'use strict';

const body = document.querySelector('body')
const API_KEY = `495d7d518972a2488d8477a10fbd601a`;
const input = document.querySelector('#input')
const btn = document.querySelector('#btn')
const card = document.querySelector('.card')
const mainCard = document.querySelector('.main__inner')
const cardId = document.querySelector('#cardId')
const timeBlock = document.querySelector('.time')
const suggWrapp = document.querySelector('#suggestion-wrapper')
const containerBlock = document.querySelector('.container-block')

const city = document.querySelector('.card__city-name');
const country = document.querySelector('.card__city-country')
const temp = document.querySelector('.card__block-degree--temp');
const condition = document.querySelector('.card__block-condition');


//! Pre-loader
function loader() {
  const loader = document.querySelector('.loader-wrapper');

  window.addEventListener('load', function () {

    setTimeout(() => {
      loader.classList.add('loader-wrapper--hidden')
      body.style.justifyContent = 'unset'
    }, 1000);


  })
}

loader()

let map;

//! Get the user's location if geolocation is enabled
navigator.geolocation.getCurrentPosition(success, error);

//! Successfully obtaining geolocation and displaying information in the card and the city on the map
function success(position) {
  const { latitude, longitude } = position.coords;

  removeCard()
  removeListWeather()

  fetch(`https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${latitude}&lon=${longitude}&appid=${API_KEY}`)
    .then(response2 => response2.json())
    .then(data2 => {
      renderCard(data2)
      showOnMap(latitude, longitude)
      getCurrentTime(latitude, longitude)
    })

  fetch(`https://api.openweathermap.org/data/2.5/forecast?units=metric&lat=${latitude}&lon=${longitude}&appid=${API_KEY}`)
    .then(response2 => response2.json())
    .then(data2 => {
      renderWeatherCanvas(data2)
      renderWeatherBlock(data2)
    })
}

//! Unsuccessful acquisition of geolocation and display of information with an error in the card
function error(error) {

  const emptyMap = document.querySelector('#map')

  const mainInner = document.querySelector('.main__inner ')
  const containerBlock = document.querySelector('.container-block')
  if (emptyMap) {
    emptyMap.remove()
    mainInner.style.justifyContent = 'center'
    containerBlock.style.display = 'none'
  }

  console.warn(`ERROR(${error.code}): ${error.message}`);
  card.innerText = `Your location has not been determined.
Enter the name of the city`;
  card.classList.add('card-error')
  card.classList.remove('none')
}

let sunRiceHour, sunRiceMinutes, sunSetHour, sunSetMinutes;

//! Delete all the cards with errors on the page


function renderCard(data) {

  const sunrice = new Date(data.sys.sunrise * 1000)
  sunRiceHour = sunrice.getHours()
  sunRiceMinutes = sunrice.getMinutes()

  const sunset = new Date(data.sys.sunset * 1000)
  sunSetHour = sunset.getHours()
  sunSetMinutes = sunset.getMinutes().toString().padStart(2, '0')

  card.innerText = ``;
  card.classList.remove('card-error')
  card.classList.remove('none')

  const name = data.weather[0].description
  const description = name.charAt(0).toUpperCase() + name.slice(1)

  const visibility = data.visibility / 1000;

  const html = `<div id="cardId" class="card">
          <div class="card__city">
            <div class="card__city-name">${data.name}</div>
            <sup class="card__city-country">${data.sys.country}</sup>
          </div>
          <div class="card__block">
            <div class="card__block-degree">
              <div class="card__block-degree--temp">${Math.round(data.main.temp)}</div>
              <sup>°c</sup>
            </div>
            <img class="card__block-img" src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="">
          </div>
          <div class="card__block-condition">
            Feels Like: ${Math.round(data.main.feels_like)}<sup>°c</sup> <br>
             ${data.weather[0].main}. ${description}.<br>
            Humidity:${data.main.humidity}% <br>
            Visibility:${visibility}km.<br>
            Wind: ${data.wind.speed}km/h
        </div>`

  mainCard.insertAdjacentHTML("beforeend", html)
}

//! Listen to the city search button
btn.addEventListener('click', function (e) {
  e.preventDefault();
  const mainInner = document.querySelector('.main__inner')
  const map = document.querySelector('#map')

  if (!input.value) return

  if (map) {
    map.style.display = 'unset'
  } else {
    const div = document.createElement('div')
    div.id = 'map';
    mainInner.appendChild(div)

  }

  document.querySelector('.time').style.display = 'block'
  containerBlock.style.display = 'flex'

  delCurrentCanvas()
  removeCardErr()
  removeCard();
  removeListWeather();

  const cityName = input.value.trim();
  input.value = '';

  fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=5&appid=${API_KEY}`)
    .then(response => response.json())
    .then(data => data[0])
    .then(data => {
      const { lat, lon } = data
      const res = fetch(`https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lat}&lon=${lon}&appid=${API_KEY}`)

      showOnMap(lat, lon)
      getCurrentTime(lat, lon)
      return res
    })
    .then(response2 => response2.json())
    .then(data2 => renderCard(data2))
    .catch(e => {
      console.error(`${e} 🧐`);
      const map = document.querySelector('#map')
      map.style.display = 'none'
      containerBlock.style.display = 'none'
      document.querySelector('.time').style.display = 'none'

      showDisplayError(`Something went wrong🧐: Probably there is no such city.<br>`)
      mainInner.style.justifyContent = 'center'
    })

  suggWrapp.style.display = 'none';

  //! Weather request for 5 days
  fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=5&appid=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      return data[0];
    })
    .then(data => {
      const { lat, lon } = data
      const res = fetch(`https://api.openweathermap.org/data/2.5/forecast?units=metric&lat=${lat}&lon=${lon}&appid=${API_KEY}`)
      showOnMap(lat, lon)
      return res
    })
    .then(data => data.json())
    .then(data => {
      renderWeatherCanvas(data)
      renderWeatherBlock(data)
    })
})

//! Display a card with an error message
function showDisplayError(message) {
  const html = `
      <div class="error">${message}</div>`;
  mainCard.insertAdjacentHTML('beforeend', html);
};

//! Delete a card with errors on the page
function removeCardErr() {
  const prevCard = document.querySelector('.error')
  if (prevCard) prevCard.remove()
}

//! Delete all cards on the page
function removeCard() {
  const prevCard = document.querySelector('.card')
  if (prevCard) prevCard.remove()
}


//! Delete the list of days on the page
function removeListWeather() {
  const prevCardList = document.querySelectorAll('.week')
  const prevCardList2 = document.querySelectorAll('.week__show ')

  prevCardList.forEach(list => {
    if (list) list.remove()
  })

  prevCardList2.forEach(list => {
    if (list) list.remove()
  })
}

//! Display the map on the page
function showOnMap(lat, lan) {

  if (map) {
    map.remove()
  }

  map = L.map('map').setView([lat, lan], 13);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 13,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)
}

//! Requesting, receiving and filtering cities via the API
function showListCities() {
  let mass = []

  fetch(`https://raw.githubusercontent.com/lmfmaier/cities-json/master/cities500.json`)
    .then(response => response.json())
    .then(data => {

      data.forEach(city => mass.push(city.name))
      return mass
    })
    .then(mass => {

      const filterSet = new Set(mass);
      const newFilterMass = Array.from(filterSet)

      input.addEventListener('input', function () {
        suggWrapp.style.display = 'block'
        const inputText = input.value.toLowerCase();
        const suggestions = newFilterMass.filter(function (city) {
          return city.toLowerCase().startsWith(inputText);

        });

        if (suggestions.length === 0) {
          suggWrapp.style.display = 'none'
        }
        displaySuggestions(suggestions);

      })

    })

}
showListCities()

//! Display a list of cities in the search when entering the first letters of the city name
function displaySuggestions(suggestions) {
  suggWrapp.innerHTML = '';

  const shortMass = suggestions.slice(0, 15);

  shortMass.forEach(function (suggestion) {
    var div = document.createElement('div');
    div.className = 'suggestion';
    div.textContent = suggestion;
    div.addEventListener('click', function () {
      input.value = suggestion;
      suggWrapp.innerHTML = '';
      suggWrapp.style.display = 'none';
    });
    suggWrapp.appendChild(div);
  });
}

//! Hide the list of cities in the search when clicking on a document anywhere
document.addEventListener('click', function (event) {
  if (!event.target.closest('.input')) {
    suggWrapp.innerHTML = '';
    suggWrapp.style.display = 'none';
  }
});

//! Get the current time in the city based on the coordinates
function getCurrentTime(lat, lon) {
  fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=VZZ2OFVP7KGF&format=json&by=position&lat=${lat}&lng=${lon}`)
    .then(response => response.json())
    .then(data => {
      renderCurrentTime(data.formatted)
    })
}

let month;
let day;
let dayOfWeek;

function renderCurrentTime(time) {
  delCurrentTime()
  const date = new Date(time)

  const massMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  month = date.getMonth();
  dayOfWeek = date.getDay();
  day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  const dayName = days[dayOfWeek];
  const currTime = `
  <div class="time-block">
  ${massMonth[month]} ${day}, ${dayName}, ${hours}:${minutes}
       </div>
       `
  timeBlock.insertAdjacentHTML('beforeend', currTime)
}

function delCurrentTime() {
  const prevCurrTime = document.querySelector('.time-block')
  if (prevCurrTime) prevCurrTime.remove()
}

function renderWeatherCanvas(data) {
  const wrapp = document.querySelector('.container-weather');
  const canvas = document.createElement('canvas');
  canvas.id = 'weatherChart';
  canvas.classList = 'canvas';
  canvas.width = 600;
  canvas.height = 300;

  wrapp.appendChild(canvas);

  let massTime = [];
  let massDegree = [];

  for (let i = 0; i < 8; data.list[i++]) {
    const elementTime = new Date(data.list[i].dt_txt);
    const hour = elementTime.getHours().toString().padStart(2, '0');
    const minute = elementTime.getMinutes().toString().padStart(2, '0');
    massTime.push(`${hour}:${minute}`);

    const elementDegree = data.list[i].main.temp
    massDegree.push(parseFloat(parseInt(elementDegree).toFixed(2)));

  }

  const weatherData = {
    labels: massTime,
    datasets: [{
      label: 'Temperature (°C)',
      data: massDegree,
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 3,
      pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      tension: 0.4,

    }]
  };

  const weatherChart = new Chart(canvas, {
    type: 'line',
    data: weatherData,
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
          },
          ticks: {
            callback: function (value, index, values) {
              return value + '°c';
            }
          },
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
    }
  });

  canvas.addEventListener('mousemove', handleMouseOver);
  canvas.addEventListener('mouseout', handleMouseOut);

  function handleMouseOver(event) {
    const points = weatherChart.getElementsAtEventForMode(event, 'point', weatherChart.options);
    if (points.length > 0) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }
  }

  function handleMouseOut() {
    canvas.style.cursor = 'default';
  }

}

//! Delete the current canvas graph

function delCurrentCanvas() {
  const prevCurrCanvas = document.querySelector('.canvas')
  if (prevCurrCanvas) prevCurrCanvas.remove()
}

//! Displaying a block with the weather for the next 5 days

function renderWeatherBlock(data) {

  const wrappShow = document.querySelector('.container-show')

  const date = new Date(data.list[0].dt * 1000)
  let dataCurrent = date.getDate()

  let mainHtml = '';

  const massMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


  let dataHtml;
  let massTemp = []
  let massHumidity = []
  let massSpeedWindy = []
  let massDayOfWeek = []
  let massMonthOfYear = []
  let massPic = []
  let massDescr = []
  let objMass = []

  for (let i = 0; i < 5; i++) {

    data.list.filter(function (obj) {

      let x = new Date(obj.dt * 1000);
      let newDate = x.getDate()

      if (dataCurrent === Number(newDate)) {
        let date = new Date(obj.dt * 1000)
        let numOfDayRes = date.getDay()
        let numofMonth = date.getMonth()
        let numofMonthRes = numofMonth
        massDayOfWeek.push(numOfDayRes)
        massMonthOfYear.push(numofMonthRes)
        dataHtml = dataCurrent;
        massTemp.push(obj.main.temp)
        massHumidity.push(obj.main.humidity)
        massSpeedWindy.push(obj.wind.speed)
        massPic.push(obj.weather[0].icon)
        massDescr.push(obj.weather[0].description)
        objMass.push(obj)
      }
    })


    const resDayOfWeek = massDayOfWeek.shift()
    const resMonthOfYear = massMonthOfYear.shift()
    dataCurrent++


    //! Сalculate the maximum and minimum temperature per day
    let minTemp, maxTemp;
    massTempInfo(massTemp)


    function massTempInfo(massTemp) {
      const newSortTemp = massTemp.sort((a, b) => a - b)

      if (newSortTemp.length > 1) {

        minTemp = newSortTemp.shift()
        maxTemp = newSortTemp.pop()

      }
      else if (newSortTemp.length === 1) {
        minTemp = newSortTemp.shift()
        maxTemp = minTemp;
      }
    }

    const tempValue = minTemp === maxTemp ? `${minTemp}` : ` ${maxTemp}/${minTemp}`;

    //! Calculate the average humidity value
    let resHumidity = 0;

    massHumidity.forEach(function (num) {
      resHumidity += num;
    })

    let mostResHumidity = resHumidity / massHumidity.length

    //! Calculate the average wind speed
    let resWindySpeed = 0;

    massSpeedWindy.forEach(function (num) {
      resWindySpeed += num;
    })

    let mostResWindySpeed = resWindySpeed / massSpeedWindy.length


    //!Get a picture at 12:00 p.m.
    let massPicInd;


    function getMassPicInd(massPic) {
      if (massPic.length === 8) {
        massPicInd = massPic[4]
      }
      if (massPic.length < 8) {
        massPicInd = massPic[0]
      }
    }
    getMassPicInd(massPic)

    //! Get a description of the weather at 12:00 p.m.

    let massDescrInd;

    function getmassDescr(massDescr) {
      if (massDescr.length === 8) {
        massDescrInd = massDescr[4]
      }
      if (massDescr.length < 8) {
        massDescrInd = massDescr[0]
      }
    }
    getmassDescr(massDescr)


    //! Get the temperature for 4 periods of the day
    let morningDegree, morningDegreeFeelsLike, afternoonDegree, afternoonDegreeFeelsLike, eveningDegree, eveningDegreeFeelsLike, nightDegree, nightDegreeFeelsLike;


    objMass.forEach(obj => {
      if (obj.dt_txt.includes('09:00:00')) {
        morningDegree = obj.main.temp
        morningDegreeFeelsLike = obj.main.feels_like
      }
      if (obj.dt_txt.includes('15:00:00')) {
        afternoonDegree = obj.main.temp
        afternoonDegreeFeelsLike = obj.main.feels_like
      }
      if (obj.dt_txt.includes('21:00:00')) {
        eveningDegree = obj.main.temp
        eveningDegreeFeelsLike = obj.main.feels_like
      }
      if (obj.dt_txt.includes('00:00:00')) {
        nightDegree = obj.main.temp
        nightDegreeFeelsLike = obj.main.feels_like
      }

    })

    let resNightDegree, resNightDegreeFeelsLike;
    let resMorningDegree, resMorningDegreeFeelsLike;
    let resEveningDegree, resEveningDegreeFeelsLike;
    let resAfternoonDegree, resAfternoonDegreeFeelsLike;


    resNightDegree = nightDegree ? nightDegree : 'API';
    resNightDegreeFeelsLike = nightDegreeFeelsLike ? nightDegreeFeelsLike : 'API';

    resMorningDegree = morningDegree ? morningDegree : 'API';
    resMorningDegreeFeelsLike = morningDegreeFeelsLike ? morningDegreeFeelsLike : 'API';

    resEveningDegree = eveningDegree ? eveningDegree : 'API';
    resEveningDegreeFeelsLike = eveningDegreeFeelsLike ? eveningDegreeFeelsLike : 'API';

    resAfternoonDegree = afternoonDegree ? afternoonDegree : 'API';
    resAfternoonDegreeFeelsLike = afternoonDegreeFeelsLike ? afternoonDegreeFeelsLike : 'API'


    const html = `
        <div class="week">
          <div class="week__info">
            <div class="week__info-date"> ${days[resDayOfWeek]}, ${massMonth[resMonthOfYear]} ${dataHtml}</div>
            <div class="week__info-temp">
               <img class="week__img" src="https://openweathermap.org/img/wn/${massPicInd}@2x.png" alt="">
                 <span class="week__degree"> 
                 ${tempValue}°C
                 </span>
            </div>
            <div class="week__info-descr">
            <span class="week__info-descr-span"> ${massDescrInd}</span>
               <svg class="arrow" data-v-5ed3171e="" width="12px" height="12px" viewBox="0 0 512 512" class="icon-down">
              <path fill="#48484A"
                d="M98.9,184.7l1.8,2.1l136,156.5c4.6,5.3,11.5,8.6,19.2,8.6c7.7,0,14.6-3.4,19.2-8.6L411,187.1l2.3-2.6  c1.7-2.5,2.7-5.5,2.7-8.7c0-8.7-7.4-15.8-16.6-15.8v0H112.6v0c-9.2,0-16.6,7.1-16.6,15.8C96,179.1,97.1,182.2,98.9,184.7z">
              </path>
            </svg>
            </div>
          </div>
        </div>

        <div class="week__show none">
          <div class="week__show-block">
          <img class="week__show-img" src="https://openweathermap.org/img/wn/${massPicInd}@2x.png" alt="">
          
            <div class="week__show-descr">
              <div class="week__show-descr-title">
                ${data.list[0].weather[0].main}. ${data.list[0].weather[0].description}.
            </div>
              <div class="week__show-descr-degree">The high will be ${maxTemp}°C, the low will be ${minTemp}°C.
              </div>
            </div>
          </div>
          <div class="week__show-indicators">
            <div class="week__show-indicators-snow">
      <svg class="snow icon-snow" data-v-dccd94fc="" data-v-3208ab85="" viewBox="0 0 512 512" class="">
        <path data-v-dccd94fc=""
    d="M142.5 25.1C85.3 33.9 36.6 72.5 15.1 126c-8.6 21.4-11.5 39.2-10.9 65.4.4 15 1 20.1 3.2 30 4.8 20.9 12 37.5 24 55.6 9.1 13.7 29.2 34 42.6 42.9 23 15.4 49.3 25 75.3 27.6l6.7.7v73l3.4 3.4c3 3 4 3.4 8.6 3.4s5.6-.4 8.6-3.4l3.4-3.4V348h176v73.2l3.4 3.4c3 3 4 3.4 8.6 3.4s5.6-.4 8.6-3.4l3.4-3.4V348h19.3c14.8 0 21.3-.5 28.2-1.9 39.4-8.1 70.5-39.4 78.7-79.1 2.9-13.9 2.1-36.8-1.7-49.5-10.9-36.7-40.5-64.1-77.4-71.7-7.9-1.6-12.2-1.9-24.6-1.5-18.4.6-26.6 2.5-42 10.1-23.4 11.6-41.7 31.4-50.1 54.2-3.2 8.9-2.8 13.3 1.8 17.6 2.5 2.4 3.9 2.8 8.4 2.8 6.9 0 10-2.8 13.9-12.3 17-41.5 65.6-59.8 106-39.8 38 18.9 53.5 65.3 34.6 103.6-9.9 20-27.8 34.4-50.6 40.8l-8 2.2h-131c-146.5 0-140 .3-162.5-7.2-34.3-11.4-64.4-37.6-80.1-69.8-9.8-20.2-13.9-38-13.9-60.5 0-37.4 13.5-70 40.1-96.7 26.3-26.4 59.6-40.3 96.6-40.4 37 0 71 13.9 96.8 39.6 11 11.1 18.6 21.6 26.3 36.5 4.6 9 6.5 11.7 9.3 13.2 7.6 4.2 16.6-.6 17.6-9.4.4-3.8-.1-5.9-3.4-12.9-17.8-37.9-51.1-68.2-90.9-82.8-4.4-1.6-13.4-4.2-20-5.7-10.6-2.4-14.2-2.8-32.4-3-11.3-.1-23.2.2-26.5.7z">
        </path>
    <path data-v-dccd94fc=""
    d="M259.4 387.4l-3.4 3.4v90.4l3.4 3.4c3 3 4 3.4 8.6 3.4s5.6-.4 8.6-3.4l3.4-3.4v-90.4l-3.4-3.4c-3-3-4-3.4-8.6-3.4s-5.6.4-8.6 3.4z">
     </path>
      </svg>
        <span>0%</span>
            </div>
            <div class="week__show-indicators-windy">
              <svg class="windy" data-v-47880d39="" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000"
                xml:space="preserve" class="icon-wind-direction" style="transform: rotate(369deg);">
                <g data-v-47880d39="" fill="#48484a">
                  <path data-v-47880d39=""
                    d="M510.5,749.6c-14.9-9.9-38.1-9.9-53.1,1.7l-262,207.3c-14.9,11.6-21.6,6.6-14.9-11.6L474,48.1c5-16.6,14.9-18.2,21.6,0l325,898.7c6.6,16.6-1.7,23.2-14.9,11.6L510.5,749.6z">
                  </path>
                  <path data-v-47880d39=""
                    d="M817.2,990c-8.3,0-16.6-3.3-26.5-9.9L497.2,769.5c-5-3.3-18.2-3.3-23.2,0L210.3,976.7c-19.9,16.6-41.5,14.9-51.4,0c-6.6-9.9-8.3-21.6-3.3-38.1L449.1,39.8C459,13.3,477.3,10,483.9,10c6.6,0,24.9,3.3,34.8,29.8l325,898.7c5,14.9,5,28.2-1.7,38.1C837.1,985,827.2,990,817.2,990z M485.6,716.4c14.9,0,28.2,5,39.8,11.6l255.4,182.4L485.6,92.9l-267,814.2l223.9-177.4C454.1,721.4,469,716.4,485.6,716.4z">
                  </path>
                </g>
              </svg>
              <span>${mostResWindySpeed.toFixed(2)}km/h</span>
            </div>
            <span class="week__show-indicators-humidity">
              Humidity:
             ${mostResHumidity.toFixed(2)}%
            </span>
          </div>
          <div class="week__show-weatherday">
            <table class="week__show-weatherday-table">
              <tr>
                <td>&nbsp;</td>
                <td class="week__show-weatherday-partday">Morning</td>
                <td class="week__show-weatherday-partday">Afternoon</td>
                <td class="week__show-weatherday-partday">Evening</td>
                <td class="week__show-weatherday-partday">Night</td>
              </tr>
              <tr>
                <td class="week__show-weatherday-title">TEMPERATURE</td>
                <td class="week__show-weatherday-text">${resMorningDegree}°C</td>
                <td class="week__show-weatherday-text">${resAfternoonDegree}°C</td>
                <td class="week__show-weatherday-text">${resEveningDegree}°C</td>
                <td class="week__show-weatherday-text">${resNightDegree}°C</td>
              </tr>
              <tr>
                <td class="week__show-weatherday-title">FEELS LIKE</td>
                <td class="week__show-weatherday-text">${resMorningDegreeFeelsLike}°C</td>
                <td class="week__show-weatherday-text">${resAfternoonDegreeFeelsLike}°C</td>
                <td class="week__show-weatherday-text">${resEveningDegreeFeelsLike}°C</td>
                <td class="week__show-weatherday-text">${resNightDegreeFeelsLike}°C</td>
              </tr>
            </table>
          </div>
          <div class="week__show-sun">
            <div class="week__show-sunrise">
              <p class="week__show-sunrice-title">SUNRISE</p>
              <p class="week__show-sunrice-time">${sunRiceHour}:${sunRiceMinutes}</p>
            </div>
            <div class="week__show-sunset">
              <p class="week__show-sunset-title">SUNSET</p>
              <p class="week__show-sunset-time">${sunSetHour}:${sunSetMinutes}</p>
            </div>
          </div>
        </div>
  `
    mainHtml += html
    massTemp = []
    massDayOfWeek = []
    massMonthOfYear = []
    massSpeedWindy = []
    massPic = []
    massDescr = []
    objMass = []
  }

  wrappShow.insertAdjacentHTML('beforeend', mainHtml)
  listenToClick()
}

//! The function of opening/closing a block with information about the weather for the day, as well as hiding other days
function listenToClick() {
  const weekBlocks = document.querySelectorAll('.week');

  weekBlocks.forEach(function (el) {
    el.addEventListener('click', function (e) {
      const currEl = e.target.closest('.week');

      currEl.nextElementSibling.classList.toggle('none');
      currEl.querySelector('.arrow').classList.toggle('arrow-turn')

      weekBlocks.forEach(function (otherEl) {
        if (otherEl !== currEl) {
          otherEl.classList.toggle('none');
        }
      });
    });
  });
}

