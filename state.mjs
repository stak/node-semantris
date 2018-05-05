

export default class SemantrisGameState {
    static get STATE_INIT() { return 0; }
    static get STATE_PLAY() { return 1; }
    static get STATE_ANIM() { return 2; }
    static get STATE_OVER() { return 3; }

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

            // ゲーム設定、updator によって更新される
            this.gameMode = '';
            this.streakMax = 0;
            this.wordLevel = null;
            this.targetNum = 0;
            this.targetBorder = 0;
            this.fillBorder = 0;
            this.dieBorder = 0;
            this.fallFrame = 0;

            // 表示ワード、updator によって更新される
            this.candidates = null;
            this.targetIndexes = null;

            // 内部状態
            this.innerState = SemantrisGameState.STATE_INIT;
        }
    }

    get targets() {
        return this.targetIndexes.map(i => this.candidates[i]);
    }

    get score() {
        return this.breakCount * 15 +
               this.breakLine * 10;
    }

    get stage() {
        return Math.floor(this.score / 500);
    }

    get paramsForRank() {
        return [this.candidates, this.targets, this.gameMode];
    }
}
