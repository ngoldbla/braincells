const EventEmitter = require('events');

class ServiceManager extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
    this.startupOrder = [];
    this.shutdownOrder = [];
  }

  registerService(name, service, options = {}) {
    this.services.set(name, {
      service,
      status: 'stopped',
      options
    });
    
    // Add to startup/shutdown order
    if (options.priority !== undefined) {
      this.startupOrder.push({ name, priority: options.priority });
      this.startupOrder.sort((a, b) => a.priority - b.priority);
    } else {
      this.startupOrder.push({ name, priority: 999 });
    }
    
    this.shutdownOrder = [...this.startupOrder].reverse();
  }

  async startService(name) {
    const serviceInfo = this.services.get(name);
    if (!serviceInfo) {
      throw new Error(`Service ${name} not found`);
    }

    if (serviceInfo.status === 'running') {
      return;
    }

    try {
      this.emit('service:starting', name);
      serviceInfo.status = 'starting';
      
      await serviceInfo.service.start();
      
      serviceInfo.status = 'running';
      this.emit('service:started', name);
    } catch (error) {
      serviceInfo.status = 'error';
      this.emit('service:error', { name, error });
      throw error;
    }
  }

  async stopService(name) {
    const serviceInfo = this.services.get(name);
    if (!serviceInfo) {
      throw new Error(`Service ${name} not found`);
    }

    if (serviceInfo.status === 'stopped') {
      return;
    }

    try {
      this.emit('service:stopping', name);
      serviceInfo.status = 'stopping';
      
      await serviceInfo.service.stop();
      
      serviceInfo.status = 'stopped';
      this.emit('service:stopped', name);
    } catch (error) {
      serviceInfo.status = 'error';
      this.emit('service:error', { name, error });
      throw error;
    }
  }

  async startAll() {
    for (const { name } of this.startupOrder) {
      await this.startService(name);
    }
  }

  async stopAll() {
    for (const { name } of this.shutdownOrder) {
      await this.stopService(name);
    }
  }

  async restartService(name) {
    await this.stopService(name);
    await this.startService(name);
  }

  getServiceStatus(name) {
    const serviceInfo = this.services.get(name);
    return serviceInfo ? serviceInfo.status : null;
  }

  getAllStatuses() {
    const statuses = {};
    for (const [name, info] of this.services) {
      statuses[name] = info.status;
    }
    return statuses;
  }

  async healthCheck() {
    const health = {};
    for (const [name, info] of this.services) {
      if (info.service.healthCheck) {
        try {
          health[name] = await info.service.healthCheck();
        } catch (error) {
          health[name] = { healthy: false, error: error.message };
        }
      } else {
        health[name] = { healthy: info.status === 'running' };
      }
    }
    return health;
  }
}

module.exports = { ServiceManager };