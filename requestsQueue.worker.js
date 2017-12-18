const worker = self;

// Fake request service
class Connection {
    constructor() {
        this.active = false;
        this.counter = 0;

        this.increaseCounter = this.increaseCounter.bind(this);
        this.doRequest = this.doRequest.bind(this);
    }

    increaseCounter() {
        this.counter += 1;

        if (this.counter % 10 === 0) {
            this.active = !this.active;
        }
    }

    doRequest(params) {
        this.increaseCounter();

        return new Promise((resolve) => {
            setTimeout(() => resolve(`return ${params}`), 1000);
        })
    }
}

class RequestsQueue {
    constructor() {
        this.queue = [];
        this.connection = new Connection();

        this.push = this.push.bind(this);
        this.tryNext = this.tryNext.bind(this);
    }

    push(id, data) {
        const queueItem = () => {
            this.connection.doRequest(data)
                .then((data) => ({data}))
                .catch((error) => ({error}))
                .then(({data, error}) => {
                    if (!this.connection.active) {
                        this.queue.push(queueItem);
                        return;
                    }

                    worker.postMessage({id, data, error});
                })
        };

        this.queue.push(queueItem);
        setTimeout(this.tryNext);
    }

    tryNext() {
        if (this.queue.length === 0) {
            return;
        }

        const queueItem = this.queue.shift();

        queueItem();

        if (this.queue.length > 0) {
            setTimeout(this.tryNext);
        }
    }
}

const requestsQueue = new RequestsQueue();

worker.onmessage = (event) => {
    const {id, data} = event.data;

    requestsQueue.push(id, data);
};