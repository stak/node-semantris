import chalk from 'chalk';
import {FB} from './define';

const WIDTH = 24;
const LEFT = 16;
const pad = Array(LEFT + 1).join(' ');
let buffer = '';

function clearTTY() {
    process.stdout.write('\x1b[2j');
    process.stdout.write('\x1b[0f');
}

function write(str = '') {
    buffer += str.split('\n')
                 .map(line => pad + line)
                 .join('\n') + '\n';
}

function flush() {
    console.log(buffer);
}

function renderWords(state) {
    const renderWord = (word, bg, fore) => {
        const spaces = Array(WIDTH + 1).join(' ');
        const padding = (word.word + spaces).slice(0, WIDTH);
        write(bg(fore(padding)));
    };

    for (let i = state.dieBorder; i >= 0; --i) {
        const w = state.candidates[i];
        if (w) {
            const bg = i < state.targetBorder ?
                    chalk.bgBlackBright : chalk.bgBlack;
            const fore = state.targetIndexes.includes(i) ?
                        chalk.cyan : chalk.white;
            renderWord(w, bg, fore);
        } else {
            write();
        }
    }
    write();
}

function renderStreakGauge(state) {
    const unitLen = Math.round(WIDTH / state.streakMax);
    const unit = '[' + Array(unitLen - 1).join(' ') + ']';

    let s = '';
    for (let i = 0; i < state.streakMax; ++i) {
        if (i < state.streakProgress) {
            s += chalk.bgBlue(unit);
        } else {
            s += unit;
        }
    }
    write(s);
}

function renderStatusBar(state, feedback) {
    if (feedback === FB.TICK_DIE) {
        write(chalk.bgRed(chalk.white('       GAME  OVER       ')));
    } else {
        write();
    }
    write(chalk.green('SCORE: ' + state.score));
}

function renderDebug(state, action, feedback) {
    if (action) {
        console.log(chalk.yellow('(' + action + ')') + ' => ' +
                    chalk.magenta(feedback));
    } else {
        console.log('');
    }
}

function renderEffect(state) {
    // TODO:
}

function renderPrompt() {
    process.stdout.write(pad + '> ');
}

export default function ttyRenderer(state, action, feedback) {
    if (feedback === FB.TICK) {
        return;
    }

    clearTTY();
    // renderDebug(state, action, feedback);
    renderWords(state);
    renderStreakGauge(state);
    renderStatusBar(state, feedback);
    renderEffect(state);
    flush();
    renderPrompt();
}
