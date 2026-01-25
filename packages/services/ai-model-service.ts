/**
 * AI Model Service: YOLOv10 Infrastructure
 */

export class AIModelService {
  private static instance: AIModelService;
  private isLoaded = false;

  public static getInstance(): AIModelService {
    if (!AIModelService.instance) {
      AIModelService.instance = new AIModelService();
    }
    return AIModelService.instance;
  }

  /**
   * Checks if the browser supports WebGL/GPU acceleration
   */
  public checkGPUSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  /**
   * Simulates/Loads the YOLOv10 model asynchronously
   */
  public async loadModel(onProgress: (progress: number) => void): Promise<void> {
    if (this.isLoaded) return;

    if (!this.checkGPUSupport()) {
      throw new Error('GPU_UNSUPPORTED: Device lacks WebGL capability for YOLOv10.');
    }

    // Simulate multi-stage loading of neural weights
    const stages = [
      { p: 15, msg: 'Initializing WebGL Context' },
      { p: 45, msg: 'Fetching YOLOv10 Weights (142MB)' },
      { p: 75, msg: 'Compiling Shaders' },
      { p: 100, msg: 'Neural Engine Warmup' }
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 400));
      onProgress(stage.p);
    }

    this.isLoaded = true;
  }
}

export const aiModelService = AIModelService.getInstance();