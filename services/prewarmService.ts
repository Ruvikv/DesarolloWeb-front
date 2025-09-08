/**
 * Servicio robusto para pre-calentar el backend de Render
 * Incluye health checks, exponential backoff y manejo de ERR_FAILED
 */
export const prewarmService = {
  isBackendHealthy: false as boolean,
  retryCount: 0 as number,
  maxRetries: 10 as number,
  baseDelay: 1000 as number, // 1 segundo inicial
  
  /**
   * Verifica si el backend está disponible usando un health check
   */
  async checkBackendHealth(): Promise<boolean> {
    const baseUrl = 'https://mi-tienda-backend-o9i7.onrender.com';
    
    try {
      console.log('🏥 Verificando salud del backend...');
      
      // Intentar con un endpoint simple primero
      const response = await fetch(`${baseUrl}/catalogo/publico`, {
        method: 'HEAD', // Solo headers, más rápido
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      });
      
      this.isBackendHealthy = true;
      console.log('✅ Backend está disponible');
      return true;
    } catch (error) {
      this.isBackendHealthy = false;
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log(`❌ Backend no disponible: ${errorMsg}`);
      return false;
    }
  },

  /**
   * Calcula el delay para exponential backoff
   */
  getBackoffDelay(): number {
    return Math.min(this.baseDelay * Math.pow(2, this.retryCount), 30000); // Max 30 segundos
  },

  /**
   * Hace ping al backend para despertarlo con estrategia robusta
   */
  async warmupBackend(): Promise<boolean> {
    console.log('🔥 Iniciando pre-calentamiento robusto del backend...');
    
    const baseUrl = 'https://mi-tienda-backend-o9i7.onrender.com';
    const endpoints = [
      '/catalogo/publico',
      '/categorias', 
      '/catalogo/destacados'
    ];
    
    // Primero verificar salud del backend
    const isHealthy = await this.checkBackendHealth();
    if (isHealthy) {
      console.log('✅ Backend ya está disponible!');
      this.retryCount = 0;
      return true;
    }
    
    console.log(`🔄 Intento ${this.retryCount + 1}/${this.maxRetries} de despertar backend...`);
    
    // Usar múltiples estrategias de ping
    const promises = endpoints.map(async (endpoint) => {
      try {
        console.log(`🌡️ Despertando servidor con ${endpoint}...`);
        
        // Estrategia 1: no-cors para despertar
        await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(15000)
        });
        
        // Estrategia 2: cors para verificar respuesta real
        await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET', 
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          cache: 'no-cache',
          signal: AbortSignal.timeout(15000)
        });
        
        console.log(`✅ Ping exitoso a ${endpoint}`);
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.log(`⚠️ Error en ping a ${endpoint}: ${errorMsg}`);
        return false;
      }
    });
    
    // Ejecutar todos los pings y esperar resultados
    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    
    if (successCount > 0) {
      console.log(`✅ ${successCount}/${endpoints.length} endpoints respondieron`);
      this.isBackendHealthy = true;
      this.retryCount = 0;
      return true;
    } else {
      console.log('❌ Ningún endpoint respondió correctamente');
      return false;
    }
  },

  /**
   * Inicia el pre-calentamiento robusto en background
   * Usa exponential backoff y manejo inteligente de errores
   */
  startWarmup(): void {
    console.log('🚀 Iniciando sistema robusto de pre-calentamiento...');
    
    const attemptWarmup = async () => {
      try {
        const success = await this.warmupBackend();
        
        if (success) {
          console.log('🎉 Backend despertado exitosamente!');
          this.retryCount = 0;
          return true;
        } else {
          this.retryCount++;
          
          if (this.retryCount >= this.maxRetries) {
            console.log('❌ Máximo de reintentos alcanzado. Backend podría estar completamente inactivo.');
            return false;
          }
          
          const delay = this.getBackoffDelay();
          console.log(`⏳ Esperando ${delay/1000}s antes del siguiente intento...`);
          
          setTimeout(() => {
            attemptWarmup();
          }, delay);
          
          return false;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.log(`💥 Error crítico en pre-calentamiento: ${errorMsg}`);
        
        this.retryCount++;
        if (this.retryCount < this.maxRetries) {
          const delay = this.getBackoffDelay();
          setTimeout(() => {
            attemptWarmup();
          }, delay);
        }
        
        return false;
      }
    };
    
    // Ejecutar inmediatamente
    attemptWarmup();
    
    // También verificar periódicamente si el backend sigue saludable
    const healthCheckInterval = setInterval(async () => {
      if (!this.isBackendHealthy) {
        console.log('🔍 Backend no saludable, reintentando pre-calentamiento...');
        this.retryCount = 0; // Reset para nueva serie de intentos
        attemptWarmup();
      }
    }, 60000); // Cada minuto
    
    // Limpiar después de 15 minutos
    setTimeout(() => {
      clearInterval(healthCheckInterval);
      console.log('🛑 Sistema de pre-calentamiento finalizado');
    }, 900000); // 15 minutos
  },
  
  /**
   * Obtiene el estado actual del backend
   */
  getBackendStatus(): { healthy: boolean; retryCount: number } {
    return {
      healthy: this.isBackendHealthy,
      retryCount: this.retryCount
    };
  }
};