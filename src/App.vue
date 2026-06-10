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
      showTotal: true,
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
      energyConfig: {
        energyPriceKwh: {
          peak: 0.15,
          offPeak: 0.15,
          shoulder: 0.15
        },
        gridAccessKwh: 0.0607,
        contractedPowerKw: 6.9,
        warningThreshold: 80,
        dangerThreshold: 100,
        pricePerKwDay: 0.18,
        billingDays: 30,
        billingDateDay: 28,
        fixedCosts: {
          audiovisualFee: 3.02,
          dgegFee: 0.30
        },
        vat: {
          rate: 0.23,
          reducedRate: 0.06,
          reducedRateKwh: 300,
          useReduced: false
        },
        iecTaxKwh: 0.001,
        billingCycle: 2
      }
    }
  },

  // Methods are functions that mutate state and trigger updates.
  // They can be bound ays event handlers in templates.
  watch: {
    'energyConfig.billingCycle'(newVal) {
      if (newVal === 0) { // simple
        this.energyConfig.energyPriceKwh.offPeak = this.energyConfig.energyPriceKwh.peak;
        this.energyConfig.energyPriceKwh.shoulder = this.energyConfig.energyPriceKwh.peak;
      } else if (newVal === 1) { // bi-hourly
        this.energyConfig.energyPriceKwh.shoulder = this.energyConfig.energyPriceKwh.offPeak;
      }
    },
    'energyConfig.energyPriceKwh.peak'(newVal) {
      if (this.energyConfig.billingCycle === 0) { // simple
        this.energyConfig.energyPriceKwh.offPeak = newVal;
        this.energyConfig.energyPriceKwh.shoulder = newVal;
      }
    },
    'energyConfig.contractedPowerKw'(newVal) {
      // Handled by @change
    },
    'energyConfig.warningThreshold'(newVal) {
      // Handled by @change
    },
    'energyConfig.dangerThreshold'(newVal) {
      // Handled by @change
    },
    showHouse(newVal) {
      this.saveConfig();
    },
    showSolar(newVal) {
      this.saveConfig();
    },
    showCar1(newVal) {
      this.saveConfig();
    },
    showCar2(newVal) {
      this.saveConfig();
    },
    showWeather(newVal) {
      this.saveConfig();
    },
    showClock(newVal) {
      this.saveConfig();
    },
    showTotal(newVal) {
      this.saveConfig();
    },
    houseData(data) {
      gsap.to(this, {duration: 6, houseDataPower: Number(data?.Power ?? 0) || 0})
    },
    solarData(data) {
      gsap.to(this, {duration: 6, solarDataPower: Number(data?.Power ?? 0) || 0})
    }
  },
  computed: {
    mainGlowClass() {
      if (!this.energyConfig.contractedPowerKw || !this.houseData || (this.houseData?.Power ?? 0) === 0) return 'bg-main-glow';

      const usagePercent = ((this.houseData?.Power ?? 0) / (this.energyConfig.contractedPowerKw * 1000)) * 100;

      if (this.energyConfig.dangerThreshold > 0 && usagePercent >= this.energyConfig.dangerThreshold) {
        return 'bg-main-glow-danger';
      } else if (this.energyConfig.warningThreshold > 0 && usagePercent >= this.energyConfig.warningThreshold) {
        return 'bg-main-glow-warning';
      }

      return 'bg-main-glow';
    }
  },
  methods: {
    saveConfig() {
      window.localStorage.setItem("myIotServer", this.myIotServer);
      window.localStorage.setItem("showHouse", this.showHouse);
      window.localStorage.setItem("showSolar", this.showSolar);
      window.localStorage.setItem("showCar1", this.showCar1);
      window.localStorage.setItem("showCar2", this.showCar2);
      window.localStorage.setItem("showWeather", this.showWeather);
      window.localStorage.setItem("showClock", this.showClock);
      window.localStorage.setItem("showTotal", this.showTotal);
      window.localStorage.setItem("energyConfig", JSON.stringify(this.energyConfig));

      fetch('http://' + this.myIotServer + '/energyConfig', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.energyConfig),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        console.log('Energy config updated successfully');
      })
      .catch(error => {
        console.error('Error updating energy config:', error);
      });
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
        if (wsData.measureType === 'car1') {
            that.car1Data = wsData;
            if (that.selectedPower && that.selectedPower.type === 'car1') that.selectedPower.data = wsData;
        }
        if (wsData.measureType === 'car2') {
            that.car2Data = wsData;
            if (that.selectedPower && that.selectedPower.type === 'car2') that.selectedPower.data = wsData;
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
    },
    getEnergyConfig() {
      fetch('http://' + this.myIotServer + '/energyConfig')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        this.energyConfig = {
          ...this.energyConfig,
          ...data,
          // Ensure thresholds have default values if they are missing or null
          warningThreshold: data.warningThreshold ?? this.energyConfig.warningThreshold,
          dangerThreshold: data.dangerThreshold ?? this.energyConfig.dangerThreshold
        };
        window.localStorage.setItem("energyConfig", JSON.stringify(this.energyConfig));
        console.log('Energy config fetched successfully');
      })
      .catch(error => {
        console.error('Error fetching energy config:', error);
      });
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
    if (window.localStorage.getItem("showTotal")) {
      this.showTotal = window.localStorage.getItem("showTotal") === 'true';
    }
    if (window.localStorage.getItem("energyConfig")) {
      try {
        const storedConfig = JSON.parse(window.localStorage.getItem("energyConfig"));
        this.energyConfig = {
          ...this.energyConfig,
          ...storedConfig,
          // Ensure thresholds have default values if they are missing or null
          warningThreshold: storedConfig.warningThreshold ?? this.energyConfig.warningThreshold,
          dangerThreshold: storedConfig.dangerThreshold ?? this.energyConfig.dangerThreshold
        };
      } catch (e) {
        console.error("Error parsing energyConfig from localStorage", e);
      }
    }
    this.updateClock();
    this.clockInterval = setInterval(this.updateClock, 10000);
    this.connectWebsocket();
    this.getEnergyConfig();
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
  <div class="vh-100 vh-100 m-0 text-light rounded-5 d-flex flex-column justify-content-between overflow-hidden" :class="mainGlowClass">

    <div class="d-flex justify-content-center mt-4" v-if="showClock && !selectedPower">
      <h1 class="clock-display">{{ currentTime }}</h1>
    </div>

    <div class="d-flex justify-content-center" v-if="showWeather && !selectedPower">
      <div class="d-flex justify-content-around align-content-center rounded-bottom-4 px-5">
        <div class="p-3 text-center d-flex align-content-center">
            <h3 class="mb-0 ml-4 text-capitalize opacity-75">{{ weatherData?.description ?? '' }}</h3>

          <div class="mx-2 d-flex">
            <h3 class="my-0 mx-2"><i
              class="bi bi-thermometer-half"/>{{ (weatherData?.temp ?? 0).toFixed(0) }}<span class="text-info small">ºC </span>
            </h3>
            <h3 class="my-0 mx-2"><i
              class="bi bi-droplet"/>{{ weatherData?.humidity ?? 0 }}<span class="text-info small">% </span></h3>
          </div>

          <!--<img class="m-auto" v-if="weatherData.icon" :src="weatherData.icon" alt="" width="120"/>-->
        </div>
      </div>
    </div>

    <div class="flex-fill d-flex justify-content-center align-content-center " v-if="!selectedPower">

      <PowerStatus 
          title="Rede"  
          title-icon="bi-lightning-charge-fill" 
          :data="houseData" 
          v-if="showHouse" 
          @show-detail="showDetail('house', 'Rede', 'bi-lightning-charge-fill')"
          :warning-threshold="energyConfig.warningThreshold"
          :danger-threshold="energyConfig.dangerThreshold"
          :contracted-power="energyConfig.contractedPowerKw * 1000"
          :show-total="showTotal"
      />
      <PowerStatus title="Solar" title-icon="bi-brightness-high-fill" :data="solarData" v-if="showSolar" @show-detail="showDetail('solar', 'Solar', 'bi-brightness-high-fill')" :show-total="showTotal"/>
      <PowerStatus title="BEV"    title-icon="bi-ev-front" :data="car1Data"  v-if="showCar1" @show-detail="showDetail('car1', 'BEV', 'bi-ev-front')" :show-total="showTotal"/>
      <PowerStatus title="BEV2"   title-icon="bi-ev-front" :data="car2Data"  v-if="showCar2" @show-detail="showDetail('car2', 'BEV2', 'bi-ev-front')" :show-total="showTotal"/>

    </div>

    <PowerDetail
        v-else
        :title="selectedPower.title"
        :title-icon="selectedPower.icon"
        :data="selectedPower.data"
        :warning-threshold="selectedPower.type === 'house' ? energyConfig.warningThreshold : 0"
        :danger-threshold="selectedPower.type === 'house' ? energyConfig.dangerThreshold : 0"
        :contracted-power="selectedPower.type === 'house' ? energyConfig.contractedPowerKw * 1000 : 0"
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
          <i :class="(internetCheck?.online ?? false) ? 'text-success':'text-danger blink-2'"
             class="bi bi-check-circle-fill"></i>

        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade text-dark" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel"
         aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-bottom-0 pt-4 px-4">
            <h5 class="modal-title fw-bold" id="exampleModalLabel">Settings & Configuration</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body px-4 pb-4">

            <ul class="nav nav-pills mb-4 bg-light p-1 rounded-3" id="configTabs" role="tablist">
              <li class="nav-item flex-fill" role="presentation">
                <button class="nav-link active w-100 rounded-3" id="general-tab" data-bs-toggle="tab" data-bs-target="#general" type="button" role="tab" aria-controls="general" aria-selected="true">General</button>
              </li>
              <li class="nav-item flex-fill" role="presentation">
                <button class="nav-link w-100 rounded-3" id="energy-tab" data-bs-toggle="tab" data-bs-target="#energy" type="button" role="tab" aria-controls="energy" aria-selected="false">Energy</button>
              </li>
            </ul>

            <div class="tab-content" id="configTabsContent">
              <div class="tab-pane fade show active" id="general" role="tabpanel" aria-labelledby="general-tab">
                <div class="card border-0 bg-light rounded-3 p-3 mb-4">
                  <h6 class="mb-3 fw-bold text-muted text-uppercase small">Server Configuration</h6>
                  <div class="mb-2">
                    <label for="myIotServerInput" class="form-label fw-semibold">Zine IoT Server Address</label>
                    <div class="input-group">
                      <input type="text" class="form-control form-control-lg border-end-0" id="myIotServerInput"
                             placeholder="ws://your-server-address" v-model="myIotServer">
                      <button class="btn btn-primary bg-cyan-gradient text-dark border-0 px-4 fw-semibold" type="button" @click="connectWebsocket()">Apply</button>
                    </div>
                    <div class="mt-2 small d-flex align-items-center">
                      <span class="me-2">Connection Status:</span>
                      <span :class="myIotServerConnected ? 'text-success':'text-danger'" class="fw-bold">
                        {{ myIotServerConnected ? 'Connected' : 'Disconnected' }}
                        <i :class="myIotServerConnected ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'" class="bi ms-1"></i>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="card border-0 bg-light rounded-3 p-3 mb-4">
                  <h6 class="mb-3 fw-bold text-muted text-uppercase small">Thresholds</h6>
                  <div class="row g-3">
                    <div class="col-md-6 mb-3">
                      <label for="warningThreshold" class="form-label fw-semibold text-warning">Warning Threshold (%)</label>
                      <input type="number" class="form-control form-control-lg" id="warningThreshold" v-model.number="energyConfig.warningThreshold" @change="saveConfig">
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="dangerThreshold" class="form-label fw-semibold text-danger">Danger Threshold (%)</label>
                      <input type="number" class="form-control form-control-lg" id="dangerThreshold" v-model.number="energyConfig.dangerThreshold" @change="saveConfig">
                    </div>
                  </div>
                </div>

                <div class="card border-0 bg-light rounded-3 p-3 mb-4">
                  <h6 class="mb-3 fw-bold text-muted text-uppercase small">Interface Visibility</h6>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <div class="form-check form-switch p-3 bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-between">
                        <div>
                          <label class="form-check-label fw-medium" for="showHouse">House Power</label>
                          <div class="small text-muted font-monospace">myiot/house/power</div>
                        </div>
                        <input class="form-check-input ms-0" type="checkbox" id="showHouse" v-model="showHouse">
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-check form-switch p-3 bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-between">
                        <div>
                          <label class="form-check-label fw-medium" for="showSolar">Solar Power</label>
                          <div class="small text-muted font-monospace">myiot/solar/power</div>
                        </div>
                        <input class="form-check-input ms-0" type="checkbox" id="showSolar" v-model="showSolar">
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-check form-switch p-3 bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-between">
                        <div>
                          <label class="form-check-label fw-medium" for="showCar1">Car 1 Power</label>
                          <div class="small text-muted font-monospace">myiot/car1/power</div>
                        </div>
                        <input class="form-check-input ms-0" type="checkbox" id="showCar1" v-model="showCar1">
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-check form-switch p-3 bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-between">
                        <div>
                          <label class="form-check-label fw-medium" for="showCar2">Car 2 Power</label>
                          <div class="small text-muted font-monospace">myiot/car2/power</div>
                        </div>
                        <input class="form-check-input ms-0" type="checkbox" id="showCar2" v-model="showCar2">
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-check form-switch p-3 bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-between">
                        <div>
                          <label class="form-check-label fw-medium" for="showWeather">Weather</label>
                          <div class="small text-muted font-monospace">top-weather-div</div>
                        </div>
                        <input class="form-check-input ms-0" type="checkbox" id="showWeather" v-model="showWeather">
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-check form-switch p-3 bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-between">
                        <div>
                          <label class="form-check-label fw-medium" for="showClock">Clock</label>
                          <div class="small text-muted font-monospace">top-clock-div</div>
                        </div>
                        <input class="form-check-input ms-0" type="checkbox" id="showClock" v-model="showClock">
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-check form-switch p-3 bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-between">
                        <div>
                          <label class="form-check-label fw-medium" for="showTotal">Total Values</label>
                          <div class="small text-muted font-monospace">PowerStatus/Total</div>
                        </div>
                        <input class="form-check-input ms-0" type="checkbox" id="showTotal" v-model="showTotal" @change="saveConfig">
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="tab-pane fade" id="energy" role="tabpanel" aria-labelledby="energy-tab">
                <div class="card border-0 bg-light rounded-3 p-3 mb-4">
                  <h6 class="mb-3 fw-bold text-muted text-uppercase small">Billing Cycle</h6>
                  <div class="btn-group w-100 p-1 bg-white rounded-3 shadow-sm" role="group">
                    <input type="radio" class="btn-check" name="billingCycle" id="cycleSimple" :value="0" v-model="energyConfig.billingCycle">
                    <label class="btn btn-outline-info border-0 rounded-2" for="cycleSimple">Simple</label>

                    <input type="radio" class="btn-check" name="billingCycle" id="cycleBiHourly" :value="1" v-model="energyConfig.billingCycle">
                    <label class="btn btn-outline-info border-0 rounded-2" for="cycleBiHourly">Bi-hourly</label>

                    <input type="radio" class="btn-check" name="billingCycle" id="cycleTriHourly" :value="2" v-model="energyConfig.billingCycle">
                    <label class="btn btn-outline-info border-0 rounded-2" for="cycleTriHourly">Tri-hourly</label>
                  </div>
                </div>

                <div class="card border-0 bg-light rounded-3 p-3 mb-4">
                  <h6 class="mb-3 fw-bold text-muted text-uppercase small">Energy Pricing (EUR/kWh)</h6>
                  <div class="row g-3 mb-3">
                    <div class="col" v-if="energyConfig.billingCycle === 2 || energyConfig.billingCycle === 1 || energyConfig.billingCycle === 0">
                      <label class="form-label small fw-medium">{{ energyConfig.billingCycle === 0 ? 'Base Price' : 'Peak Rate' }}</label>
                      <input type="number" step="0.0001" class="form-control" v-model.number="energyConfig.energyPriceKwh.peak">
                    </div>
                    <div class="col" v-if="energyConfig.billingCycle === 2 || energyConfig.billingCycle === 1">
                      <label class="form-label small fw-medium">Off-Peak Rate</label>
                      <input type="number" step="0.0001" class="form-control" v-model.number="energyConfig.energyPriceKwh.offPeak">
                    </div>
                    <div class="col" v-if="energyConfig.billingCycle === 2">
                      <label class="form-label small fw-medium">Shoulder Rate</label>
                      <input type="number" step="0.0001" class="form-control" v-model.number="energyConfig.energyPriceKwh.shoulder">
                    </div>
                  </div>

                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label small fw-medium">Grid Access Fee</label>
                      <div class="input-group">
                        <input type="number" step="0.0001" class="form-control" v-model.number="energyConfig.gridAccessKwh">
                        <span class="input-group-text small">kWh</span>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-medium">Contracted Power</label>
                      <div class="input-group">
                        <input type="number" step="0.1" class="form-control" v-model.number="energyConfig.contractedPowerKw" @change="saveConfig">
                        <span class="input-group-text small">kW</span>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-medium">Price per kW Day</label>
                      <input type="number" step="0.0001" class="form-control" v-model.number="energyConfig.pricePerKwDay">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-medium">IEC Tax</label>
                      <div class="input-group">
                        <input type="number" step="0.0001" class="form-control" v-model.number="energyConfig.iecTaxKwh">
                        <span class="input-group-text small">kWh</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row g-3 mb-4">
                  <div class="col-md-6">
                    <div class="card border-0 bg-light rounded-3 p-3 h-100">
                      <h6 class="mb-3 fw-bold text-muted text-uppercase small">Billing Period</h6>
                      <div class="row g-2">
                        <div class="col-6">
                          <label class="form-label small fw-medium">Days</label>
                          <input type="number" class="form-control" v-model.number="energyConfig.billingDays">
                        </div>
                        <div class="col-6">
                          <label class="form-label small fw-medium">Start Day</label>
                          <input type="number" class="form-control" v-model.number="energyConfig.billingDateDay">
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="card border-0 bg-light rounded-3 p-3 h-100">
                      <h6 class="mb-3 fw-bold text-muted text-uppercase small">Fixed Fees (Monthly)</h6>
                      <div class="row g-2">
                        <div class="col-6">
                          <label class="form-label small fw-medium">Audiovisual</label>
                          <input type="number" step="0.01" class="form-control" v-model.number="energyConfig.fixedCosts.audiovisualFee">
                        </div>
                        <div class="col-6">
                          <label class="form-label small fw-medium">DGEG</label>
                          <input type="number" step="0.01" class="form-control" v-model.number="energyConfig.fixedCosts.dgegFee">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card border-0 bg-light rounded-3 p-3">
                  <h6 class="mb-3 fw-bold text-muted text-uppercase small">VAT Configuration</h6>
                  <div class="form-check form-switch mb-3 bg-white p-3 rounded-3 shadow-sm d-inline-flex align-items-center mx-1">
                    <input class="form-check-input ms-0 me-3" type="checkbox" id="useReducedVat" v-model="energyConfig.vat.useReduced">
                    <label class="form-check-label fw-medium" for="useReducedVat">Enable Reduced VAT Rate</label>
                  </div>

                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label small fw-medium">Standard Rate (%)</label>
                      <input type="number" step="0.01" class="form-control" v-model.number="energyConfig.vat.rate">
                    </div>
                    <div class="col-md-4" v-if="energyConfig.vat.useReduced">
                      <label class="form-label small fw-medium">Reduced Rate (%)</label>
                      <input type="number" step="0.01" class="form-control" v-model.number="energyConfig.vat.reducedRate">
                    </div>
                    <div class="col-md-4" v-if="energyConfig.vat.useReduced">
                      <label class="form-label small fw-medium">Threshold (kWh)</label>
                      <input type="number" class="form-control" v-model.number="energyConfig.vat.reducedRateKwh">
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div class="modal-footer border-top-0 px-4 pb-4">
            <button type="button" class="btn btn-light px-4 py-2 fw-semibold shadow-sm" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary bg-cyan-gradient px-4 py-2 fw-semibold shadow-sm text-dark border-0" data-bs-dismiss="modal" @click="saveConfig()">
              Save Configuration
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
    background: radial-gradient(ellipse at top, rgba(92, 156, 255, 0.2) 0%, rgba(5, 8, 28, 0) 100%),
                linear-gradient(180deg, #080d2c 0%, #05081c 100%);
    transition: background 1s ease;
}

.bg-main-glow-warning {
    background: radial-gradient(ellipse at top, rgba(255, 218, 106, 0.4) 0%, rgba(5, 8, 28, 0) 100%),
                linear-gradient(180deg, #332b00 0%, #05081c 100%);
    transition: background 1s ease;
}

.bg-main-glow-danger {
    background: radial-gradient(ellipse at top, rgba(220, 53, 69, 0.4) 0%, rgba(5, 8, 28, 0) 100%),
                linear-gradient(180deg, #3c0d0d 0%, #05081c 100%);
    transition: background 1s ease;
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
  background: linear-gradient(180deg, rgba(92, 156, 255, 0.4) 0%, rgba(255, 255, 255, 0.02) 100%);
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
  background: #05081c !important;
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
