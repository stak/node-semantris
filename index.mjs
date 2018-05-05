'use strict';
import chalk from 'chalk';
import readline from 'readline';

import SemantrisAPI from './api';
import SemantrisGameState from './state';
import SemantrisGameUpdator from './updator';
import {GAMEMODE_ARCADE, GAMEMODE_BLOCKS} from './define';
import * as util from './util';


class Semantris {
    constructor(updator = SemantrisGameUpdator) {
        this.api = new SemantrisAPI('curated23', 'SqYg6-xZ44vb_Z4');
        this.updator = updator;
        this.words = null;
        this.state = null;
    }

    reset() {
        this.state = null;
        return this;
    }

    async update(action, ...args) {
        args.unshift(this.state);
        const {next, feedback, cont} = this.updator[action].apply(this.updator, args);

        console.log(chalk.yellow("update(" + action + ") => " + feedback));
        
        this.state = next;
        await this.view(feedback);
        
        return cont ? await this.update(cont) : this;
    }

    async gameStart(gameMode = GAMEMODE_ARCADE) {
        this.words = await this.api.start(gameMode);

        return await this.gameReset(gameMode);
    }

    async gameReset(gameMode = GAMEMODE_ARCADE) {
        return await this.reset().update('init', gameMode, (num, levels) => {
            return this.selectWords(num, levels, false);
        });
    }

    async gameInput(input) {
        const matchResult = await this.api.rank(input,
                                    ...this.state.paramsForRank);
        return await this.update('input', matchResult);
    }

    async view(feedback) {
        // process.stdout.write('\x1b[2J');
        // process.stdout.write('\x1b[0f');

        for (let i = this.state.candidates.length - 1; i >= 0; --i) {
            const e = this.state.candidates[i];
            if (this.state.targetIndexes.includes(i)) {
                console.log(chalk.blue(e.word));
            } else {
                console.log(e.word);
            }

            if (this.state.targetBorder === i) {
                console.log("----------------------");
            }
        }

        // feedback に応じた演出・ウェイト
        switch (feedback) {
            case SemantrisGameUpdator.FB_INPUT_FAIL:
                break;
            case SemantrisGameUpdator.FB_INPUT_SUCCESS:
            case SemantrisGameUpdator.FB_DESTROY_NORMAL:
                await util.sleep(400);
                break;
            case SemantrisGameUpdator.FB_DESTROY_STREAK:
                await util.sleep(1500);
                break;
            default:
                break;
        }

        process.stdout.write('\n> '); // prompt
    }

    filterWord(levels, filterCurrentWords = true) {
        let words = this.words;
        if (typeof levels === 'number') {
            words = words.filter(w => w.level === levels);
        } else if (levels instanceof Array) {
            words = words.filter(w => levels.includes(w.level));
        }
        if (filterCurrentWords) {
            words = words.filter(w => this.state.candidates.every(
                                 c => c.word !== w.word));
        }
        return words;
    }
    selectWord(levels, filterCurrentWords = true) {
        const words = this.filterWord(levels, filterCurrentWords);
        return util.getRandomElement(words);
    }
    selectWords(num, levels, filterCurrentWords = true) {
        const words = this.filterWord(levels, filterCurrentWords);
        return util.getRandomElements(words, num);
    }
}

function line(rl) {
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

new Semantris().gameStart().then(async (game) => {
    const rl = readline.createInterface(process.stdin);
    for (let input;;) {
        try {
            input = await line(rl);
        } catch (e) {
            console.log("(exit)");
            break;
        }
        if (input) {
            await game.gameInput(input);
        } else {
            await game.view();
        }
    }
});