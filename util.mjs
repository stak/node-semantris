import readline from 'readline';

export function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

export function getRandomElements(array, num) {
    return shuffleArray(array.slice()).slice(-num);
}

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

const rl = readline.createInterface(process.stdin);
export function line() {
    return new Promise((resolve, reject) => {
        function onLine(line) {
            resolve(line);
            rl.removeListener('close', onClose);
        }
        function onClose() {
            process.stdin.destroy();
            reject();
            rl.removeListener('line', onLine);
        }
        rl.once('line', onLine)
          .once('close', onClose);
    });
}