<script xmlns="http://www.w3.org/1999/html">
import gsap from 'gsap';
import PowerStatus from "@/PowerStatus.vue";
import PowerDetail from "@/PowerDetail.vue";

export default {
  components: {PowerStatus, PowerDetail},
  // Properties returned from data() become reactive state
  // and will be exposed on `this`.
  data() {
    return {
      myIotServer: "localhost:1880",
      myIotServerConnected: false,
      showHouse: true,
      showSolar: true,
      showCar1: false,
      showCar2: false,
      showWeather: true,
      showClock: true,
      currentTime: "",
      houseData: {Power: 0, Today: 0},
      houseDataPower: 0,
      solarData: {Power: 0, Today: 0},
      solarDataPower: 0,
      car1Data: {Power: 0, Today: 0},
      car2Data: {Power: 0, Today: 0},
      weatherData: {description: "", temp: 0, humidity: 0, icon: ""},
      internetCheck: {online: false},
      selectedPower: null,
      reconnectDelay: 1000,
    }
  },

  // Methods are functions that mutate state and trigger updates.
  // They can be bound ays event handlers in templates.
  methods: {
    saveConfig() {
      window.localStorage.setItem("myIotServer", this.myIotServer);
      window.localStorage.setItem("showHouse", this.showHouse);
      window.localStorage.setItem("showSolar", this.showSolar);
      window.localStorage.setItem("showCar1", this.showCar1);
      window.localStorage.setItem("showCar2", this.showCar2);
      window.localStorage.setItem("showWeather", this.showWeather);
      window.localStorage.setItem("showClock", this.showClock);
    },
    connectWebsocket() {
      let that = this;
      console.log("Starting connection to WebSocket Server");

      if (this.connection) {
        console.log("Closing existing connection");
        this.connection.onclose = null; // Prevent auto-reconnect during manual switch
        this.connection.close();
      }

      this.connection = new WebSocket("ws://" + this.myIotServer + "/");

      this.connection.onmessage = function (event) {
        try {
          let wsData = JSON.parse(event.data);
          if (wsData.measureType === 'house') {
            that.houseData = wsData;
            if (that.selectedPower && that.selectedPower.type === 'house') that.selectedPower.data = wsData;
          }
          if (wsData.measureType === 'solar') {
            that.solarData = wsData;
            if (that.selectedPower && that.selectedPower.type === 'solar') that.selectedPower.data = wsData;
          }
          if (wsData.measureType === 'weather') {
            that.weatherData = wsData;
          }
          if (wsData.measureType === 'internetCheck') {
            that.internetCheck = wsData;
          }
        } catch (e) {
          console.error("Error parsing WebSocket message", e);
        }
      };

      this.connection.onopen = function (event) {
        console.log("Successfully connected to the WebSocket server");
        that.getWeather();
        that.checkInternet();
        that.myIotServerConnected = true;
        that.reconnectDelay = 1000; // Reset delay on successful connection
        that.startHeartbeat();
      };

      this.connection.onclose = function () {
        console.log("WebSocket connection closed. Attempting to reconnect...");
        that.stopHeartbeat();
        that.myIotServerConnected = false;
        setTimeout(() => {
          that.connectWebsocket();
        }, that.reconnectDelay);
        // Exponential backoff: increase delay for next attempt, up to 30 seconds
        that.reconnectDelay = Math.min(that.reconnectDelay * 2, 30000);
      };

      this.connection.onerror = function (error) {
        console.error("WebSocket error:", error);
        that.connection.close();
      };
    },
    startHeartbeat() {
      this.stopHeartbeat();
      this.heartbeatInterval = setInterval(() => {
        if (this.connection && this.connection.readyState === WebSocket.OPEN) {
          this.connection.send(JSON.stringify({type: "ping"}));
        }
      }, 30000); // Send ping every 30 seconds
    },
    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    },
    getWeather() {
      fetch('http://' + this.myIotServer + '/weather');
    },
    checkInternet() {
      fetch('http://' + this.myIotServer + '/checkInternet');
    },
    showDetail(type, title, icon) {
      let data;
      if (type === 'house') data = this.houseData;
      if (type === 'solar') data = this.solarData;
      if (type === 'car1') data = this.car1Data;
      if (type === 'car2') data = this.car2Data;

      this.selectedPower = {
        type,
        title,
        icon,
        data
      };
    },
    closeDetail() {
      this.selectedPower = null;
    },
    updateClock() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString('pt-PT', { hour12: false, hour: '2-digit', minute: '2-digit' });
    }
  },
  watch: {
    houseData(data) {
      gsap.to(this, {duration: 6, houseDataPower: Number(data.Power) || 0})
    },
    solarData(data) {
      gsap.to(this, {duration: 6, solarDataPower: Number(data.Power) || 0})
    }
  },
  // Lifecycle hooks are called at different stages
  // of a component's lifecycle.
  // This function will be called when the component is mounted.
  mounted() {
    if (window.localStorage.getItem("myIotServer")) {
      this.myIotServer = window.localStorage.getItem("myIotServer");
    }
    if (window.localStorage.getItem("showHouse")) {
      this.showHouse = window.localStorage.getItem("showHouse") === 'true';
    }
    if (window.localStorage.getItem("showSolar")) {
      this.showSolar = window.localStorage.getItem("showSolar") === 'true';
    }
    if (window.localStorage.getItem("showCar1")) {
      this.showCar1 = window.localStorage.getItem("showCar1") === 'true';
    }
    if (window.localStorage.getItem("showCar2")) {
      this.showCar2 = window.localStorage.getItem("showCar2") === 'true';
    }
    if (window.localStorage.getItem("showWeather")) {
      this.showWeather = window.localStorage.getItem("showWeather") === 'true';
    }
    if (window.localStorage.getItem("showClock")) {
      this.showClock = window.localStorage.getItem("showClock") === 'true';
    }
    this.updateClock();
    this.clockInterval = setInterval(this.updateClock, 10000);
    this.connectWebsocket();
    //this.getWeather();
    //this.checkInternet();
  },
  unmounted() {
    if (this.connection) {
      this.connection.onclose = null;
      this.connection.close();
    }
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    this.stopHeartbeat();
  }
}
</script>

<template>
  <div class="vh-100 vh-100 m-0 text-light bg-main-glow rounded-4 d-flex flex-column justify-content-between">

    <div class="d-flex justify-content-center mt-4" v-if="showClock && !selectedPower">
      <h1 class="clock-display">{{ currentTime }}</h1>
    </div>

    <div class="d-flex justify-content-center" v-if="showWeather && !selectedPower">
      <div class="d-flex justify-content-around align-content-center rounded-bottom-4 px-5">
        <div class="p-3 text-center d-flex align-content-center">
            <h3 class="mb-0 ml-4 text-capitalize opacity-75">{{ weatherData.description }}</h3>

          <div class="mx-2 d-flex">
            <h3 class="my-0 mx-2"><i
              class="bi bi-thermometer-half"/>{{ weatherData.temp.toFixed(0) }}<span class="text-info small">ºC </span>
            </h3>
            <h3 class="my-0 mx-2"><i
              class="bi bi-droplet"/>{{ weatherData.humidity }}<span class="text-info small">% </span></h3>
          </div>

          <!--<img class="m-auto" v-if="weatherData.icon" :src="weatherData.icon" alt="" width="120"/>-->
        </div>
      </div>
    </div>

    <div class="flex-fill d-flex justify-content-center align-content-center " v-if="!selectedPower">

      <PowerStatus title="Rede"  title-icon="bi-lightning-charge-fill" :data="houseData" v-if="showHouse" @show-detail="showDetail('house', 'Rede', 'bi-lightning-charge-fill')"/>
      <PowerStatus title="Solar" title-icon="bi-brightness-high-fill" :data="solarData" v-if="showSolar" @show-detail="showDetail('solar', 'Solar', 'bi-brightness-high-fill')"/>
      <PowerStatus title="BEV"    title-icon="bi-ev-front" :data="car1Data"  v-if="showCar1" @show-detail="showDetail('car1', 'BEV', 'bi-ev-front')"/>
      <PowerStatus title="BEV2"   title-icon="bi-ev-front" :data="car2Data"  v-if="showCar2" @show-detail="showDetail('car2', 'BEV2', 'bi-ev-front')"/>

    </div>

    <PowerDetail
        v-else
        :title="selectedPower.title"
        :title-icon="selectedPower.icon"
        :data="selectedPower.data"
        @close="closeDetail"
    />

    <div class="m-0 py-3 px-4 d-flex justify-content-between align-items-center rounded-top-4"
         style="font-size: 1.4rem;">
      <div class="d-flex gap-4 align-items-center">
        <!-- Button trigger modal -->
        <button type="button" class="btn btn-info text-dark bg-cyan-gradient py-2 px-4" data-bs-toggle="modal" data-bs-target="#exampleModal">
          <i class="bi bi-gear"></i>
        </button>
      </div>


      <div class="d-flex gap-4 align-items-center">

        <div class="d-flex align-items-center">

          <span class="text-light mx-2">Internet</span>
          <i :class="internetCheck.online ? 'text-success':'text-danger blink-2'"
             class="bi bi-check-circle-fill"></i>

        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade text-dark" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel"
         aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Config</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">

            <label for="myIotServerInput" class="form-label">zine-iot-server Address</label>
            <div class="input-group mb-3">
              <input type="text" class="form-control" id="myIotServerInput" aria-describedby="basic-addon3"
                     v-model="myIotServer">
              <button class="btn btn-outline-primary bg-cyan-gradient" type="button" @click="connectWebsocket()">Apply</button>
            </div>
            <div class="mb-3">
              zine-iot-server
              <i :class="myIotServerConnected ? 'text-success':'text-danger blink-2'" class="bi bi-check-circle-fill"></i>
            </div>

            <p>GUI Config</p>

            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="showHouse" v-model="showHouse">
              <label class="form-check-label" for="showHouse">show-house-power</label>
              <span class="font-monospace"> (myiot/house/power)</span>
            </div>
            <hr>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="showSolar" v-model="showSolar">
              <label class="form-check-label" for="showSolar">show-solar-power</label>
              <span class="font-monospace"> (myiot/solar/power)</span>
            </div>
            <hr>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="showCar1" v-model="showCar1">
              <label class="form-check-label" for="showCar1">show-car1-power</label>
              <span class="font-monospace"> (myiot/car1/power)</span>
            </div>
            <hr>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="showCar2" v-model="showCar2">
              <label class="form-check-label" for="showCar2">show-car2-power</label>
              <span class="font-monospace"> (myiot/car2/power)</span>
            </div>
            <hr>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="showWeather" v-model="showWeather">
              <label class="form-check-label" for="showWeather">show-weather</label>
              <span class="font-monospace"> (top-weather-div)</span>
            </div>
            <hr>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="showClock" v-model="showClock">
              <label class="form-check-label" for="showClock">show-clock</label>
              <span class="font-monospace"> (top-clock-div)</span>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary bg-cyan-gradient" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary bg-cyan-gradient" data-bs-dismiss="modal" @click="saveConfig()">Save changes
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* GLOBAL STYLES */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Chivo+Mono:ital,wght@0,100..900;1,100..900&display=swap');

body {
    font-family: 'Inter', sans-serif !important;
    background: #000000 !important;
    color: #ffffff !important;
}

/* TEXT COLORS */
.text-blue {
    color: #2563eb;
}

.text-gray {
    color: #64748b;
}

.text-white {
    color: white;
}

/* BACKGROUNDS */
.bg-blue {
    background: #2563eb;
}

.bg-dark {
    background: #080d2c;
}

.bg-gradient-blue {
    background: linear-gradient(326deg, #080d2c 7.97%, #151e41 97.66%);

}

.bg-gradient-dark-2 {
    background: linear-gradient(180deg, #0d143c 0%, #080d2c 100%);
}

.bg-main-glow {
    background: radial-gradient(ellipse at top, rgba(92, 156, 255, 0.15) 0%, rgba(8, 13, 44, 0) 80%),
                linear-gradient(180deg, #0d143c 0%, #080d2c 100%);
}

.bg-gradient-dark {
    background: linear-gradient(135deg, #0d143c, #080d2c);
}

.bg-cyan-gradient {
    background: linear-gradient(325deg, #5c9cff 16.5%, #4a8cf0 80.24%) !important;
    border: none !important;
    color: white !important;
}

.lucien-card {
  position: relative;
  padding: 1px;
  background: linear-gradient(180deg, rgba(92, 156, 255, 0.4) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 1.5rem; /* Matches rounded-4 */
  overflow: hidden;
}

.lucien-card-inner {
  background: linear-gradient(180deg, #151e41 0%, #080d2c 100%);
  border-radius: calc(1.5rem - 1px);
  padding: 1.5rem;
  height: 100%;
}

.btn {
    border-radius: 50rem !important;
}
</style>

<style scoped>
.text-info {
  color: #5c9cff !important;
}

.text-warning {
  color: #ccd5e5 !important;
}

.text-monospace {
  font-family: "Chivo Mono", monospace;
  font-optical-sizing: auto;
  font-weight: 600;
  font-style: normal;
}

h1 {
  font-size: 2rem;
}

.clock-display {
  font-size: 5rem;
  font-weight: 300;
  margin: 0;
}

body, html, #app {
  background: #080d2c !important;
}

.blink-1 {
  -webkit-animation: blink-1 5s infinite both;
  animation: blink-1 5s infinite both;
}

/* ----------------------------------------------
 * Generated by Animista on 2024-2-21 20:38:34
 * Licensed under FreeBSD License.
 * See http://animista.net/license for more info.
 * w: http://animista.net, t: @cssanimista
 * ---------------------------------------------- */

/**
 * ----------------------------------------
 * animation blink-1
 * ----------------------------------------
 */
@-webkit-keyframes blink-1 {
  0%,
  50%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0;
  }
}

@keyframes blink-1 {
  0%,
  50%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0;
  }
}

.blink-2 {
  -webkit-animation: blink-2 3s infinite both;
  animation: blink-2 3s infinite both;
}

/* ----------------------------------------------
 * Generated by Animista on 2024-2-21 20:38:34
 * Licensed under FreeBSD License.
 * See http://animista.net/license for more info.
 * w: http://animista.net, t: @cssanimista
 * ---------------------------------------------- */

/**
 * ----------------------------------------
 * animation blink-1
 * ----------------------------------------
 */
@-webkit-keyframes blink-2 {
  0%,
  50%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0.3;
  }
}

@keyframes blink-2 {
  0%,
  50%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0.3;
  }
}
</style>
