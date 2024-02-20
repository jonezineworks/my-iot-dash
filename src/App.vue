<script>
import gsap from 'gsap';
export default {
    // Properties returned from data() become reactive state
    // and will be exposed on `this`.
    data() {
        return {
            houseData: {Power: 0, Today: 0},
            houseDataPower: 0,
            solarData: {Power: 0, Today: 0},
            solarDataPower: 0,
            weatherData: {weather: [{description: "", icon: null}], main: {temp: 0, humidity: 0}, altIcon: ""},
        }
    },

    // Methods are functions that mutate state and trigger updates.
    // They can be bound ays event handlers in templates.
    methods: {
        connectWebsocket() {
            let that = this;
            console.log("Starting connection to WebSocket Server");
            this.connection = new WebSocket("ws://192.168.2.132:1880/");

            this.connection.onmessage = function (event) {
                let wsData = JSON.parse(event.data);
                if (wsData.measureType === 'house') {
                    that.houseData = wsData;
                }
                if (wsData.measureType === 'solar') {
                    that.solarData = wsData;
                }
                if (wsData.measureType === 'weather') {
                    that.weatherData = wsData;
                }
            };

            this.connection.onopen = function (event) {
                console.log(event);
                console.log("Successfully connected to the echo websocket server...");
            };
        }
    },
    watch: {
        houseData(data) {
            gsap.to(this, { duration: 6, houseDataPower: Number(data.Power) || 0 })
        },
        solarData(data) {
            gsap.to(this, { duration: 6, solarDataPower: Number(data.Power) || 0 })
        }
    },
    // Lifecycle hooks are called at different stages
    // of a component's lifecycle.
    // This function will be called when the component is mounted.
    mounted() {
        this.connectWebsocket();
        fetch('http://192.168.2.132:1880/weather');
    }
}
</script>i

<template>
    <div class="vh-100 vh-100 m-0 text-light bg-dark d-flex justify-content-center align-content-center">
        <div class="m-auto p-4 text-light rounded-2 ">
            <div class="d-flex align-content-center">
                <div class="mx-2 text-center d-flex flex-column justify-content-center align-content-center">
                    <img class="m-auto" :src="weatherData.altIcon" alt="" width="100"/>
                    <h2 class="text-capitalize">{{ weatherData.weather[0].description }}</h2>

                    <div class="mx-2 d-flex">
                        <h1 class="mx-2">{{ weatherData.main.temp.toFixed(0) }} <span class="text-info small"> ºC</span>
                        </h1>
                        <h1 class="mx-2">{{ weatherData.main.humidity }} <span class="text-info small"> %</span></h1>
                    </div>
                </div>
            </div>
        </div>
        <div class="m-auto">
            <h2 class="text-info">Consumo Casa </h2>
            <h1>{{ houseDataPower.toFixed(0) }} <span class="text-info small">W</span> {{solarDataPower > 1 ? " - " + solarDataPower.toFixed(0) + " W" : ""}}</h1>
            <p class="mb-0 text-secondary">Total Hoje</p>
            <h2>{{ houseData.Today }} <span class="text-info small">KWh</span></h2>
            ~{{ (houseData.Today * 0.14).toFixed(2) }} €
        </div>
        <div class="m-auto">
            <h2 class="text-info">Energia Solar </h2>
            <h1>{{ solarDataPower.toFixed(0) }} <span class="text-info small">W</span></h1>
            <p class="mb-0 text-secondary">Total Hoje</p>
            <h2>{{ solarData.Today }} <span class="text-info small">KWh</span></h2>
            ~{{ (solarData.Today * 0.14).toFixed(2) }} €
        </div>

    </div>
</template>

<style scoped>

</style>
