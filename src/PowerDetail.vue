<template>
  <div class="flex-fill d-flex flex-column p-4 overflow-hidden">
    <div class="d-flex align-items-center mb-4">
      <button type="button" class="btn btn-outline-light btn-sm me-3" @click="$emit('close')">
        <i class="bi bi-arrow-left"></i> Voltar
      </button>
      <h2 class="text-info mb-0">
        <i class="bi mr-2" :class="titleIcon"></i> {{ title }} - Detalhes
      </h2>
    </div>

    <div class="row flex-fill overflow-hidden">
      <!-- Mock SVG Chart Column (2/3) -->
      <div class="col-8 h-100">
        <div class="bg-dark bg-opacity-50 rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center">
          <h4 class="text-info mb-4">Histórico de Consumo (Mock)</h4>
          <svg viewBox="0 0 400 200" class="w-100 h-auto" style="max-height: 300px;">
            <!-- Simple Mock Bar Chart SVG -->
            <rect x="10" y="100" width="40" height="80" fill="#00A7DC" rx="4" />
            <rect x="60" y="80" width="40" height="100" fill="#00A7DC" rx="4" />
            <rect x="110" y="120" width="40" height="60" fill="#00A7DC" rx="4" />
            <rect x="160" y="60" width="40" height="120" fill="#00A7DC" rx="4" />
            <rect x="210" y="90" width="40" height="90" fill="#00A7DC" rx="4" />
            <rect x="260" y="110" width="40" height="70" fill="#00A7DC" rx="4" />
            <rect x="310" y="70" width="40" height="110" fill="#00A7DC" rx="4" />
            
            <!-- Baseline -->
            <line x1="0" y1="180" x2="360" y2="180" stroke="#64748b" stroke-width="2" />
            
            <!-- Labels -->
            <text x="15" y="195" fill="#64748b" font-size="10">Seg</text>
            <text x="65" y="195" fill="#64748b" font-size="10">Ter</text>
            <text x="115" y="195" fill="#64748b" font-size="10">Qua</text>
            <text x="165" y="195" fill="#64748b" font-size="10">Qui</text>
            <text x="215" y="195" fill="#64748b" font-size="10">Sex</text>
            <text x="265" y="195" fill="#64748b" font-size="10">Sáb</text>
            <text x="315" y="195" fill="#64748b" font-size="10">Dom</text>
          </svg>
          <p class="text-muted mt-4 small">Visualização simplificada para ambiente mobile.</p>
        </div>
      </div>

      <!-- Details Column (1/3) -->
      <div class="col-4 h-100 overflow-auto">
        <div class="bg-gradient-dark bg-opacity-25 rounded-4 p-4 h-100 shadow border border-secondary border-opacity-10">
          <h4 class="text-info border-bottom border-secondary pb-2 mb-3">Informação Geral</h4>
          <div class="mb-4">
            <p class="text-secondary mb-1 small">POTÊNCIA ATUAL</p>
            <h2 class="text-monospace mb-0">
              {{ data.Power.toFixed(0) }} <span class="text-info small">W</span>
            </h2>
          </div>

          <div class="mb-4">
            <p class="text-secondary mb-1 small">TOTAL HOJE</p>
            <h3 class="text-monospace mb-0">
              {{ data.Today.toFixed(3) }} <span class="text-info small">kWh</span>
            </h3>
          </div>

          <h4 class="text-info border-bottom border-secondary pb-2 mb-3 mt-5">Contabilidade</h4>
          <div class="mb-4">
            <p class="text-secondary mb-1 small">CUSTO ESTIMADO (MÊS)</p>
            <h2 class="text-monospace mb-0 text-warning">
              {{ (data.Today * 30 * 0.14).toFixed(2) }} <span class="small">€</span>
            </h2>
            <p class="text-muted small">* Baseado em projeção mensal</p>
          </div>

          <div class="mb-4">
            <p class="text-secondary mb-1 small">POUPANÇA CO2</p>
            <h3 class="text-monospace mb-0 text-success">
              {{ (data.Today * 0.233).toFixed(2) }} <span class="small">kg</span>
            </h3>
          </div>

          <div class="mt-auto pt-4">
            <div class="alert alert-info bg-opacity-10 border-info text-info small py-2 px-3">
              <i class="bi bi-info-circle-fill me-2"></i>
              Dados atualizados em tempo real via WebSocket.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PowerDetail',
  props: {
    data: { type: Object, required: true },
    title: { type: String, default: '' },
    titleIcon: { type: String, default: '' }
  },
  emits: ['close'],
  mounted() {
    console.log("PowerDetail mounted for:", this.title);
  }
}
</script>

<style scoped>
.text-monospace {
  font-family: "Chivo Mono", monospace;
  font-weight: 600;
}
</style>
