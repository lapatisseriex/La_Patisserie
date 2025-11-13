// Simple FIFO task queue with configurable concurrency (default 1)
// Ensures tasks run in order; returns a promise that resolves/rejects with task result

export class TaskQueue {
  constructor(concurrency = 1) {
    this.concurrency = Math.max(1, concurrency);
    this.queue = [];
    this.active = 0;
  }

  add(taskFn, { signal } = {}) {
    return new Promise((resolve, reject) => {
      const task = { taskFn, resolve, reject, signal };
      this.queue.push(task);
      this.#drain();
    });
  }

  async #run(task) {
    if (task?.signal?.aborted) {
      return task.reject(new Error('Task aborted'));
    }
    this.active += 1;
    try {
      const result = await task.taskFn();
      task.resolve(result);
    } catch (err) {
      task.reject(err);
    } finally {
      this.active -= 1;
      this.#drain();
    }
  }

  #drain() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const next = this.queue.shift();
      // Run soon to allow microtasks to settle
      Promise.resolve().then(() => this.#run(next));
    }
  }
}

// Dedicated global queue for user deletions to serialize heavy operations
export const userDeletionQueue = new TaskQueue(1);
