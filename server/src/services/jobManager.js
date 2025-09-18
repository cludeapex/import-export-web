import { randomUUID } from "crypto";

const jobs = new Map();

export default ({ strapi }) => ({
  createJob(type, params = {}) {
    const jobId = randomUUID();
    const job = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      message: '',
      params,
      createdAt: new Date(),
      updatedAt: new Date(),
      result: null,
      error: null
    };
    
    jobs.set(jobId, job);
    console.log('JobManager: Created job', jobId, 'Total jobs:', jobs.size);
    return jobId;
  },

  getJob(jobId) {
    const job = jobs.get(jobId);
    // Убираем спам логи
    return job;
  },

  updateJob(jobId, updates) {
    const job = jobs.get(jobId);
    if (!job) return false;
    
    Object.assign(job, updates, { updatedAt: new Date() });
    jobs.set(jobId, job);
    return true;
  },

  setJobProgress(jobId, progress, message = '') {
    this.updateJob(jobId, { progress, message });
  },

  setJobCompleted(jobId, result) {
    this.updateJob(jobId, { 
      status: 'completed', 
      progress: 100, 
      result,
      message: 'Completed successfully'
    });
  },

  setJobError(jobId, error) {
    this.updateJob(jobId, { 
      status: 'error', 
      error: error.message || error,
      message: `Error: ${error.message || error}`
    });
  },

  deleteJob(jobId) {
    jobs.delete(jobId);
  },

  cleanup() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [jobId, job] of jobs.entries()) {
      if (now - job.updatedAt > maxAge) {
        jobs.delete(jobId);
      }
    }
  }
});