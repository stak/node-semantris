import Semantris from './';
import readline from 'readline';

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

new Semantris().start().then(async (game) => {
    for (let input;;) {
        try {
            input = await line();
        } catch (e) {
            break;
        }
        if (game.state.isGameOver) {
            break;
        }
        if (input) {
            await game.input(input);
        } else {
            game.renderer(game.state);
        }
    }
    process.exit();
});