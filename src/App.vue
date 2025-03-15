<script xmlns="http://www.w3.org/1999/html">
import gsap from 'gsap';
import PowerStatus from "@/PowerStatus.vue";

export default {
  components: {PowerStatus},
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
      houseData: {Power: 0, Today: 0},
      houseDataPower: 0,
      solarData: {Power: 0, Today: 0},
      solarDataPower: 0,
      car1Data: {Power: 0, Today: 0},
      car2Data: {Power: 0, Today: 0},
      weatherData: {description: "", temp: 0, humidity: 0, icon: ""},
      internetCheck: {online: false},
      vergilioBridgeCheck: {online: false},
      vascoGamaBridgeCheck: {online: false},
    }
  },

  // Methods are functions that mutate state and trigger updates.
  // They can be bound ays event handlers in templates.
  methods: {
    saveConfig() {
      window.localStorage.setItem("myIotServer", this.myIotServer);
      window.localStorage.setItem("isSolar", this.showSolar);
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
        that.getWeather();
        that.checkInternet();
        that.myIotServerConnected = true;
      };

      this.connection.onclose = function () {
        that.myIotServerConnected = false;
        that.connectWebsocket();
      };
    },
    getWeather() {
      fetch('http://' + this.myIotServer + '/weather');
    },
    checkInternet() {
      fetch('http://' + this.myIotServer + '/checkInternet');
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
      this.showSolar = window.localStorage.getItem("isSolar") === 'true';
    }
    this.connectWebsocket();
    //this.getWeather();
    //this.checkInternet();
  }
}
</script>

<template>
  <div class="vh-100 vh-100 m-0 text-light bg-dark rounded-4 d-flex flex-column justify-content-between">

    <div class="d-flex justify-content-around align-content-center rounded-bottom-4 bg-black bg-opacity-25">
      <div class="p-3 text-center d-flex align-content-center">
        <div class="mx-2 d-flex">
          <h2 class="mx-2"><i
            class="bi bi-thermometer-half"/>{{ weatherData.temp.toFixed(0) }}<span class="text-info small">ºC </span>
          </h2>
          <h1 class="mx-2"><i
            class="bi bi-droplet"/>{{ weatherData.humidity }}<span class="text-info small">% </span></h1>
        </div>
        <h2 class="mb-0 ml-4 text-capitalize">{{ weatherData.description }}</h2>
        <!--<img class="m-auto" v-if="weatherData.icon" :src="weatherData.icon" alt="" width="120"/>-->
      </div>
    </div>

    <div class="flex-fill d-flex justify-content-center align-content-center ">

      <PowerStatus title="Consumo Casa"  title-icon="bi-lightning-fill" :data="houseData" v-if="showHouse"/>
      <PowerStatus title="Energia Solar" title-icon="bi-brightness-high-fill" :data="solarData" v-if="showSolar"/>
      <PowerStatus title="Consumo EV"    title-icon="bi-lightning-fill" :data="car1Data"  v-if="showCar1"/>
      <PowerStatus title="Consumo EV2"   title-icon="bi-lightning-fill" :data="car2Data"  v-if="showCar2"/>

    </div>

    <div class="m-0 py-3 px-5 d-flex justify-content-between align-items-center rounded-top-4 bg-black bg-opacity-25"
         style="font-size: 1.4rem;">
      <div class="d-flex gap-4 align-items-center">
        <!-- Button trigger modal -->
        <button type="button" class="btn btn-info" data-bs-toggle="modal" data-bs-target="#exampleModal">
          <i class="bi bi-gear"></i>
        </button>
        <div class="text-light">
          MyIoTServer
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

            <label for="myIotServerInput" class="form-label">MyIoT Server Address</label>
            <div class="input-group mb-3">
              <input type="text" class="form-control" id="myIotServerInput" aria-describedby="basic-addon3"
                     v-model="myIotServer">
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
@import url('https://fonts.googleapis.com/css2?family=Chivo+Mono:ital,wght@0,100..900;1,100..900&display=swap');


.text-monospace {
  font-family: "Chivo Mono", monospace;
  font-optical-sizing: auto;
  font-weight: 600;
  font-style: normal;
}

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
