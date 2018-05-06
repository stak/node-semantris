
const BREAK_SCORE = 15;
const LINE_SCORE = 10;
const STAGE_SPAN = 500;

export default class SemantrisGameState {
    static get STATE_INIT() { return 0; }
    static get STATE_PLAY() { return 1; }
    static get STATE_ANIM_SORT() { return 2; }
    static get STATE_ANIM_CHAIN() { return 3; }
    static get STATE_ANIM_STREAK() { return 4 }
    static get STATE_DEAD() { return 5; }

    constructor(o) {
        if (o instanceof SemantrisGameState) {
            Object.assign(this, o);
            this.candidates = this.candidates && this.candidates.slice();
            this.targetIndexes = this.targetIndexes && this.targetIndexes.slice();
        } else {
            // プレイデータ、0 初期化で OK
            this.failCount = 0;
            this.breakCount = 0;
            this.breakLine = 0;
            this.streakProgress = 0;
            this.streakCount = 0;
            this.currentTime = 0;

            // ゲーム設定、updater によって更新される
            this.gameMode = '';
            this.streakMax = 0;
            this.wordLevel = null;
            this.targetNum = 0;
            this.targetBorder = 0;
            this.fillBorder = 0;
            this.dieBorder = 0;
            this.fallFrame = 0;
            this.fillFrame = 0;
            this.sortFrame = 0;
            this.destroyFrame = 0;
            this.streakFrame = 0;

            // 表示ワード、updater によって更新される
            this.candidates = null;
            this.targetIndexes = null;

            // 内部状態
            this.innerState = SemantrisGameState.STATE_INIT;
        }
    }

    get innerState() {
        return this._innerState;
    }
    set innerState(value) {
        this._innerState = value;
        this.stateSince = this.currentTime;
    }
    get stateTime() {
        return this.currentTime - this.stateSince;
    }

    get targets() {
        return this.targetIndexes.map(i => this.candidates[i]);
    }
    set targets(value) {
        this.targetIndexes = value.map(v => this.candidates.findIndex(c => c.word === v.word));
    }
    get height() {
        return this.candidates.length;
    }
    get score() {
        return this.breakCount * BREAK_SCORE +
               this.breakLine * LINE_SCORE;
    }
    get stage() {
        return Math.floor(this.score / STAGE_SPAN);
    }
    get isInit() {
        return this.innerState === SemantrisGameState.STATE_INIT;
    }
    get isGameOver() {
        return this.innerState === SemantrisGameState.STATE_DEAD;
    }
    get isActive() {
        return this.innerState === SemantrisGameState.STATE_PLAY ||
               this.innerState === SemantrisGameState.STATE_ANIM_CHAIN;
    }
    get isAnimating() {
        return [SemantrisGameState.STATE_ANIM_SORT,
                SemantrisGameState.STATE_ANIM_CHAIN,
                SemantrisGameState.STATE_ANIM_STREAK].includes(this.innerState);
    }
    get paramsForRank() {
        return [this.candidates, this.targets, this.gameMode];
    }
}
