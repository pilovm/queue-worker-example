class RequestsWorker {
    constructor() {
        this.requests = {};
        this.requestsCounter = 0;
        this.worker = new Worker("./requestsQueue.worker.js");

        this.receive = this.receive.bind(this);
        this.send = this.send.bind(this);

        this.worker.onmessage = this.receive;
    }

    send(...args) {
        const id = `request-${this.requestsCounter++}`;

        return new Promise((resolve, reject) => {
            this.requests[id] = ({data, error}) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(data);
            };

            this.worker.postMessage({id, data: args})
        });
    }

    receive(event) {
        const {id, data, error} = event.data;

        if (typeof this.requests[id] === "function") {
            this.requests[id]({data, error});
            delete this.requests[id];
        }
    }
}

const requestsWorker = new RequestsWorker();

let clicksCounter = 0;
const logNode = document.getElementById("log");

const addLog = (text) => {
    const p = document.createElement("p");

    p.innerText = text;
    logNode.appendChild(p);
};

document.getElementById("button").addEventListener("click", () => {
    const clickText = `Click №${clicksCounter++}`;

    addLog(clickText);

    requestsWorker.send(clickText)
        .then((response) => {
            addLog(response);
        })
});
