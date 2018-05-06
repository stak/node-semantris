'use strict';
import chalk from 'chalk';

import SemantrisAPI from './api';
import SemantrisGameState from './state';
import SemantrisGameUpdater from './updater';
import {GAMEMODE_ARCADE, GAMEMODE_BLOCKS} from './define';
import * as util from './util';


class Semantris {
    constructor(updater = SemantrisGameUpdater) {
        this.api = new SemantrisAPI('curated23', 'SqYg6-xZ44vb_Z4');
        this.updater = updater;
        this.words = null;
        this.state = null;
    }

    update(action, ...args) {
        args.unshift(this.state);
        const {next, feedback} = this.updater[action].apply(this.updater, args);

        this.state = next;
        return feedback;
    }

    async start(gameMode = GAMEMODE_ARCADE) {
        this.words = await this.api.start(gameMode);

        return this.reset(gameMode);
    }

    reset(gameMode = GAMEMODE_ARCADE) {
        this.state = null;
        const feedback = this.update('init', gameMode, this.selectWord.bind(this));
        this.view('init', feedback);
        this._mainLoop().then(); // 初期化が終わったらメインループ開始
        
        return this;
    }

    async _mainLoop() {
        let feedback;
        while (feedback !== SemantrisGameUpdater.FB_TICK_DIE) {
            await util.sleep(16);
            feedback = this.update('tick');
            this.view('tick', feedback);
        }
    }

    async input(input) {
        const matchResult = await this.api.rank(input,
                                    ...this.state.paramsForRank);
        const feedback = this.update('input', matchResult);
        this.view('input', feedback);
    }

    view(action, feedback) {
        if (feedback === SemantrisGameUpdater.FB_TICK) {
            return;
        }
        
        process.stdout.write('\x1b[2J');
        process.stdout.write('\x1b[0f');

        if (action) {
            console.log(chalk.yellow('(' + action + ')') + ' => ' +
                        chalk.magenta(feedback));
        } else {
            console.log('');
        }
        
        const drawWord = (word, bg, fore) => {
            const padding = (word.word + '                        ').slice(0, 24);
            console.log(bg(fore(padding)));
        };

        for (let i = this.state.dieBorder; i >= 0; --i) {
            const w = this.state.candidates[i];
            if (w) {
                const bg = i < this.state.targetBorder ?
                           chalk.bgBlackBright : chalk.bgBlack;
                const fore = this.state.targetIndexes.includes(i) ?
                             chalk.blue : chalk.white;
                drawWord(w, bg, fore);
            } else {
                console.log("");
            }

        }

        // 演出・ウェイト
        switch (feedback) {
            case SemantrisGameUpdater.FB_INPUT_FAIL:
                break;
            case SemantrisGameUpdater.FB_INPUT_SUCCESS:
            case SemantrisGameUpdater.FB_DESTROY_NORMAL:
                break;
            case SemantrisGameUpdater.FB_DESTROY_STREAK:
                break;
            default:
                break;
        }

        process.stdout.write('\n> '); // prompt
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
            console.log("");
            console.log(chalk.red('GAME OVER'));
            console.log(chalk.green('SCORE = ' + game.state.score));
            break;
        }
        if (input) {
            await game.input(input);
        } else {
            game.view();
        }
    }
    process.exit();
});