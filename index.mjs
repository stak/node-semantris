'use strict';
import chalk from 'chalk';

import SemantrisAPI from './api';
import SemantrisGameState from './state';
import SemantrisGameUpdater from './updater';
import SemantrisParamTuner from './paramTuner';
import {FB, GAMEMODE_ARCADE, GAMEMODE_BLOCKS} from './define';
import * as util from './util';


class Semantris {
    constructor(updater = SemantrisGameUpdater, tuner = SemantrisParamTuner) {
        this.api = new SemantrisAPI();
        this.updater = new updater({
            paramTuner: tuner,
            wordSelector: this.selectWord.bind(this)
        });
        this.words = null;
        this.state = null;
        this.connecting = false;
    }

    update(action, ...args) {
        args.unshift(this.state);
        const {next, feedback} = this.updater[action].apply(this.updater, args);

        this.state = next;
        return feedback;
    }

    async start(gameMode = GAMEMODE_ARCADE) {
        this.connecting = true;
        this.words = await this.api.start(gameMode);
        this.connecting = false;

        return this.reset(gameMode);
    }

    reset(gameMode = GAMEMODE_ARCADE) {
        this.state = null;
        const feedback = this.update('init', gameMode);
        this.view(this.state, 'init', feedback);
        this._mainLoop().then(); // 初期化が終わったらメインループ開始
        
        return this;
    }

    async _mainLoop() {
        let feedback;
        while (feedback !== FB.TICK_DIE) {
            await util.sleep(16);
            if (this.connecting) {
                continue; // 通信中は tick しない
            }
            feedback = this.update('tick');
            this.view(this.state, 'tick', feedback);
        }
    }

    async input(input) {
        this.connecting = true;
        // TODO: 
        const matchResult = await this.api.rank(input,
                                    ...this.state.paramsForRank);
        this.connecting = false;

        const feedback = this.update('input', matchResult);
        this.view(this.state, 'input', feedback);
    }

    view(state, action, feedback) {
        if (feedback === FB.TICK) {
            return;
        }
        
        process.stdout.write('\x1b[2J');
        process.stdout.write('\x1b[0f');

        // debug
        /*
        if (action) {
            console.log(chalk.yellow('(' + action + ')') + ' => ' +
                        chalk.magenta(feedback));
        } else {
            console.log('');
        }
        */
        
        const WIDTH = 24;
        const LEFT = 16;
        const pad = Array(LEFT + 1).join(' ');
        let buffer = '';
        function write(str = '') {
            buffer += str.split('\n')
                         .map(line => pad + line)
                         .join('\n') + '\n';
        }

        // ワード
        (function renderWords() {
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
        })();

        // ゲージ
        (function renderStreakGauge() {
            const unitLen = Math.round(WIDTH / state.streakMax);
            const unit = '[' + Array(unitLen - 1).join(' ') + ']';

            write();
            let s = '';
            for (let i = 0; i < state.streakMax; ++i) {
                if (i < state.streakProgress) {
                    s += chalk.bgBlue(unit);
                } else {
                    s += unit;
                }
            }
            write(s);
        })();

        if (feedback === FB.TICK_DIE) {
            write(chalk.bgRed(chalk.white('       GAME  OVER       ')));
            write(chalk.green('SCORE = ' + state.score));
        }
        console.log(buffer);

        // 演出・ウェイト
        switch (feedback) {
            case FB.INPUT_FAIL:
                break;
            case FB.INPUT_SUCCESS:
            case FB.DESTROY_NORMAL:
                break;
            case FB.DESTROY_STREAK:
                break;
            default:
                break;
        }

        process.stdout.write(pad + '> '); // prompt
    }

    filterWord(levels, excludes = []) {
        let words = this.words;
        if (typeof levels === 'number') {
            words = words.filter(w => w.level === levels);
        } else if (levels instanceof Array) {
            words = words.filter(w => levels.includes(w.level));
        }
        if (excludes instanceof Array && excludes.length) {
            words = words.filter(w => excludes.every(
                                 e => e.word !== w.word));
        }
        return words;
    }
    selectWord(levels, excludes = []) {
        const words = this.filterWord(levels, excludes);
        return util.getRandomElement(words);
    }
    selectWords(num, levels, excludes = []) {
        const words = this.filterWord(levels, excludes);
        return util.getRandomElements(words, num);
    }
}

new Semantris().start().then(async (game) => {
    for (let input;;) {
        try {
            input = await util.line();
        } catch (e) {
            console.log("(exit)");
            break;
        }
        if (game.state.isGameOver) {
            break;
        }
        if (input) {
            await game.input(input);
        } else {
            game.view(game.state);
        }
    }
    process.exit();
});