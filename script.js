var myMap,
    StartPlacemark,
    latitude = 0,
    longitude = 0,
    locationText = null,
    visible_search_panel = false,
    user_point_count = 0,
    UserStartPoint = null,
    UserPoints = [];

function init() {
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    if (typeof (Storage) !== "undefined") {
        document.querySelector('#warnings').textContent = "Система поддерживает Storage, используем его для сохранения пользовательских точек.";

        UserStartPoint = JSON_parse("UserStartPoint");
        UserPoints = JSON_parse("UserPoints");

    } else {
        document.querySelector('#warnings').textContent = "К сожаленью, Ваша система не поддерживает Storage!";
    };

    if ("geolocation" in navigator) {
        isSupported = "есть";

        if (UserStartPoint === null) {
            navigator.geolocation.getCurrentPosition(set_start_position, error, options);
        } else {
            latitude = UserStartPoint[0];
            longitude = UserStartPoint[1];

            init_with_start_position();
        }
    } else {
        isSupported = "нет";

        latitude = 55.75;
        longitude = 37.65;

        init_with_start_position();
    };

    document.querySelector('.output').textContent = isSupported;
}

function JSON_parse(string) {
    if (string === null) return null;
    var string_value = localStorage.getItem(string);

    if (string_value !== null) { return JSON.parse(string_value) } else { return null };
}

function set_start_position(positions) {
    latitude = positions.coords.latitude;
    longitude = positions.coords.longitude;
    UserStartPoint = [latitude, longitude];

    if (typeof (Storage) !== "undefined") localStorage.setItem("UserStartPoint", JSON.stringify(UserStartPoint));

    init_with_start_position();
}

function init_with_start_position() {
    myMap = new ymaps.Map('map', {
        center: [latitude, longitude],
        zoom: 10,
    }, { searchControlProvider: 'yandex#search' });

    let reverseGeocoder = ymaps.geocode([latitude, longitude]);

    reverseGeocoder.then(function (data) {
        locationText = data.geoObjects.get(0).properties.get('text');

        '';
        var locale = data.geoObjects.get(0);
        var name_city = (locale.getLocalities().length > 0) ? locale.getLocalities() : locale.getAdministrativeAreas();
        document.querySelector('#forecast-target').value = name_city;

        // let location = ymaps.geolocation.get(0);
        // if (location != null) {
        //     location.then(function (res) {
        //         var split_str = res.geoObjects.get(0).properties.get('text').split(',');
        //         document.querySelector('#forecast-target').value = split_str[split_str.length() - 1];
        //         console.log(split_str, split_str[split_str.length() - 1]);
        //         console.log(data.geoObjects.get(0).getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas())
        //     });
        // };

        if (UserPoints != null) {
            UserPoints.forEach(coords => {
                add_new_user_point(coords);
            });

        } else {
            UserPoints = [];
        }

        setTimeout(open_start_point, 100);

        myMap.events.add('click', function (e) {

            var coords = e.get('coords');

            UserPoints.push(coords);

            if (typeof (Storage) !== "undefined") localStorage.setItem('UserPoints', JSON.stringify(UserPoints));

            add_new_user_point(coords);
        });

        document.getElementById('ShowHideRoutePanel').onclick = function () {
            show_hide_search_panel();
        };

        document.getElementById('RemoveUserPoints').onclick = function () {
            document.getElementById('RemoveUserPoints').style.display = 'none';
            myMap.geoObjects.removeAll();
            open_start_point();
            user_point_count = 0;
            UserPoints = [];
            if (typeof (Storage) !== "undefined") {
                localStorage.removeItem("UserStartPoint");
                localStorage.removeItem("UserPoints");
            };
        };
    });
}

function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

function open_start_point() {
    StartPlacemark = new ymaps.Placemark([latitude, longitude], {
        hintContent: "Ваше местоположение",
        balloonContent: '<strong>Вы находитесь здесь:</strong><br>' + locationText,
    });

    myMap.geoObjects.add(StartPlacemark);
    StartPlacemark.balloon.open();
}

function add_new_user_point(coords) {
    user_point_count++;

    var UserPlacemark = new ymaps.Placemark(coords, {
        iconContent: user_point_count,
        balloonContent: 'Точка пользователя №' + user_point_count,
        hintContent: 'Точка пользователя №' + user_point_count
    }, {});

    myMap.geoObjects.add(UserPlacemark);
    document.getElementById('RemoveUserPoints').style.display = 'block';
}

function show_hide_search_panel() {
    if (visible_search_panel) {
        myMap.controls.remove('routePanelControl');
        document.querySelector('#ShowHideRoutePanel').value = 'Построить маршрут до точки на карте';
        StartPlacemark.balloon.open();
    } else {
        myMap.controls.add('routePanelControl', {});
        let control = myMap.controls.get('routePanelControl');

        control.routePanel.state.set({
            type: 'masstransit',
            fromEnabled: false,
            from: locationText,
            toEnabled: true,
        });
        document.querySelector('#ShowHideRoutePanel').value = 'Убрать панель построения маршрута';
        StartPlacemark.balloon.close();
    };

    visible_search_panel = !visible_search_panel;
}

ymaps.ready(init);

// weather section

const apiKey = "768e0288406389e6e0f9840659813b24";

const apiUrl = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=`;

const searchInput = document.querySelector(".search-box input");

const searchButton = document.querySelector(".search-box button");

const weatherIcon = document.querySelector(".weather-image i");

const weather = document.querySelector(".weather");

const errorText = document.querySelector(".error");

async function checkWeather(city) {
    const response = await fetch(apiUrl + city + `&appid=${apiKey}`);

    if (response.status === 404) {
        errorText.style.display = "block";
        weather.style.display = "none";
    } else {
        const data = await response.json();
        console.log(data);

        document.querySelector(".city").innerHTML = data.name;
        document.querySelector(".temp").innerHTML =
            Math.round(data.main.temp) + "&#8451";
        document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
        document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";

        if (data.weather[0].main == "Clear") {
            weatherIcon.className = "fa-solid fa-sun";
        } else if (data.weather[0].main == "Rain") {
            weatherIcon.className = "fa-solid fa-cloud-rain";
        } else if (data.weather[0].main == "Mist") {
            weatherIcon.className = "fa-solid fa-cloud-mist";
        } else if (data.weather[0].main == "Drizzle") {
            weatherIcon.className = "fa-solid fa-cloud-drizzle";
        }

        weather.style.display = "block";
        errorText.style.display = "none";
    }
}

searchButton.addEventListener("click", () => {
    checkWeather(searchInput.value);
    searchInput.value = "";
});

searchInput.addEventListener("keydown", (event) => {
    if (event.keyCode === 13) {
        checkWeather(searchInput.value);
        searchInput.value = "";
    }
});