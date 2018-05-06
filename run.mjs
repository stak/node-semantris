import Semantris from './';
import SementrisParamTuner from './paramTuner';
import readline from 'readline';

// ステージによらず最大難易度にする Tuner
class HardTuner extends SementrisParamTuner {
    // override
    _stateToData(state, table) {
        return table[table.length - 1];
    }
}

// 指定のワードレベルに固定する Tuner
class FixedLevelTuner extends SementrisParamTuner {
    constructor(level) {
        super();
        this.level = level instanceof Array ? level : [level];
    }

    // override
    wordLevel(state) {
        return this.level;
    }
}

const rl = readline.createInterface(process.stdin);
function line() {
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

function selectTuner() {
    const args = process.argv.slice(2);
    const firstArg = args[0];
    let tuner;
    switch (firstArg) {
        case 'hard':
            tuner = new HardTuner();
            break;
        case 'L1':
        case 'L2':
        case 'L3':
        case 'L4':
        case 'L5':
            tuner = new FixedLevelTuner(Number(firstArg.slice(1)));
            break;
        default:
            tuner = new SementrisParamTuner();
            break;
    }
    return tuner;
}

new Semantris({tuner: selectTuner()}).start().then(async (game) => {
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