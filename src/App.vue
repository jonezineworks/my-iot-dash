<script xmlns="http://www.w3.org/1999/html">
import gsap from 'gsap';

export default {
  // Properties returned from data() become reactive state
  // and will be exposed on `this`.
  data() {
    return {
      myIotServer: "localhost:1880",
      myIotServerConnected: true,
      isSolar: true,
      houseData: {Power: 0, Today: 0},
      houseDataPower: 0,
      solarData: {Power: 0, Today: 0},
      solarDataPower: 0,
      weatherData: {weather: [{description: "", icon: null}], main: {temp: 0, humidity: 0}, altIcon: ""},
      internetCheck: {online: true},
      vergilioBridgeCheck: {online: true},
      vascoGamaBridgeCheck: {online: true},
    }
  },

  // Methods are functions that mutate state and trigger updates.
  // They can be bound ays event handlers in templates.
  methods: {
    saveConfig() {
      window.localStorage.setItem("myIotServer", this.myIotServer);
      window.localStorage.setItem("isSolar", this.isSolar);
    },
    connectWebsocket() {
      let that = this;
      console.log("Starting connection to WebSocket Server");
      this.connection = new WebSocket("ws://" + this.myIotServer + "/");

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
        if (wsData.measureType === 'internetCheck') {
          that.internetCheck = wsData;
        }
        if (wsData.measureType === 'vergilioBridgeCheck') {
          that.vergilioBridgeCheck = wsData;
        }
        if (wsData.measureType === 'vascoGamaBridgeCheck') {
          that.vascoGamaBridgeCheck = wsData;
        }
      };

      this.connection.onopen = function (event) {
        console.log(event);
        console.log("Successfully connected to the echo websocket server...");
        that.myIotServerConnected = true;
      };

      this.connection.onclose = function () {
        that.myIotServerConnected = false;
        that.connectWebsocket();
      };
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
    if (window.localStorage.getItem("isSolar")) {
      this.isSolar = window.localStorage.getItem("isSolar") === 'true';
    }
    this.connectWebsocket();
    fetch('http://' + this.myIotServer + '/weather');
    fetch('http://' + this.myIotServer + '/checkInternet');
  }
}
</script>

<template>
  <div class="vh-100 vh-100 m-0 text-light bg-dark rounded-4 d-flex flex-column">

    <div class="flex-fill d-flex justify-content-center align-content-center">
      <div class="m-auto p-4 text-light rounded-2 ">
        <div class="d-flex align-content-center">
          <div class="mx-2 text-center d-flex flex-column justify-content-center align-content-center">
            <img class="m-auto" :src="weatherData.altIcon" alt="" width="120"/>
            <h2 class="text-capitalize">{{ weatherData.weather[0].description }}</h2>

            <div class="mx-2 d-flex">
              <h1 class="mx-2">{{ weatherData.main.temp.toFixed(0) }}<span class="text-info small">ºC <i
                class="bi bi-thermometer-half"></i></span>
              </h1>
              <h1 class="mx-2">{{ weatherData.main.humidity }}<span class="text-info small">% <i
                class="bi bi-droplet"></i></span></h1>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-fill d-flex justify-content-center align-content-center">
      <div class="m-auto">
        <h2 class="text-info">Consumo Casa <i class="bi bi-lightning-fill text-light"></i></h2>
        <h1>
          {{ houseDataPower.toFixed(0) }} <span class="text-info small">W</span>
          <span class="text-success"
                style="font-size: 1.5rem">{{ solarDataPower > 1 ? " -" + solarDataPower.toFixed(0) : "" }}</span>
          <span class="text-success" v-if="solarDataPower > 1"
                style="font-size: 1.5rem;">W</span>
          <img class="mx-1 mt-2  blink-1" v-if="solarDataPower > 1" src=""
               width="30"/>
        </h1>
        <p class="mb-0 text-secondary">Total Hoje</p>
        <div class="d-flex gap-4">
          <h2>{{ houseData.Today.toFixed(3) }} <span class="text-info small ">KWh</span></h2>
          <h2>{{ (houseData.Today * 0.14).toFixed(2) }} <span class="text-warning">€</span></h2>
        </div>
      </div>
      <div class="m-auto" v-if="isSolar">
        <h2 class="text-info">Energia Solar <i class="bi bi-brightness-high-fill text-light"></i></h2>
        <h1 :class="solarDataPower === 0 ? 'text-secondary': ''">
          {{ solarDataPower.toFixed(0) }} <span
          :class="solarDataPower === 0 ? 'text-info-emphasis': 'text-info' + ' small'">W</span>
        </h1>
        <p class="mb-0 text-secondary">Total Hoje</p>
        <div class="d-flex gap-4">
          <h2> {{ solarData.Today.toFixed(3) }} <span class="text-info small ">KWh</span></h2>
          <h2> {{ (solarData.Today * 0.14).toFixed(2) }} <span class="text-warning">€</span></h2>
        </div>
      </div>
    </div>

    <div class="m-0 py-3 px-5 d-flex justify-content-between align-items-center rounded-top-4 "
         style="background: rgba(0,0,0,0.2); font-size: 1.2rem;">
      <div class="d-flex gap-4 align-items-center">
        <!-- Button trigger modal -->
        <button type="button" class="btn btn-info" data-bs-toggle="modal" data-bs-target="#exampleModal">
          <i class="bi bi-gear"></i>
        </button>
        <div class="text-light">
          MyIOTServer
          <i :class="myIotServerConnected ? 'text-success':'text-danger blink-2'" class="bi bi-check-circle-fill"></i>
        </div>
      </div>


      <div class="d-flex gap-4 align-items-center">

        <div class="d-flex align-items-center">

          <span class="text-light mx-2">Vergilio</span>
          <i :class="vergilioBridgeCheck.online ? 'text-success':'text-danger blink-2'" class="bi bi-wifi me-2"
             style="transform: rotate(90deg)"></i>

          <i :class="vascoGamaBridgeCheck.online ? 'text-success':'text-danger blink-2'" class="bi bi-wifi ms-2"
             style="transform: rotate(-90deg)"></i>
          <span class="text-light mx-2">VascoGama</span>

          <hr class="mx-2 text-light" style="width: 1rem;"/>

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

            <label for="myIotServerInput" class="form-label">MyIOTServer</label>
            <div class="input-group mb-3">
              <input type="text" class="form-control" id="myIotServerInput" aria-describedby="basic-addon3"
                     v-model="myIotServer">
            </div>


            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="isSolar" v-model="isSolar">
              <label class="form-check-label" for="isSolar">Solar Input</label>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click="saveConfig()">Save changes
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
h1 {
  font-size: 2rem;
}

body, html, #app {
  background: black;
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
