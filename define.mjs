export const GAMEMODE_ARCADE = 'a';
export const GAMEMODE_BLOCKS = 'b';

export class Word {
    constructor(array) {
        this.word = array[0];
        this.level = Number(array[1]);
    }
}

export class MatchResult {
    constructor(array, input, candidates, targets) {
        this.word = array[0];
        this.point = Number(array[1]);
        this.rank = array[2] ? Number(array[2]) : 1;

        this.input = input;
        this.isTarget = targets.some(t => t.word === this.word);
        this.level = candidates.find(c => c.word === this.word).level;
    }

    toWord() {
        return new Word([this.word, this.level]);
    }
}
