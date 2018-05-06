
export default class SementrisParamTuner {
    constructor() {
        throw new Error('Cannot instantiate SementrisParamTuner');
    }
    
    static _stateToData(state, table) {
        return table[Math.min(state.stage, table.length - 1)];
    }

    static streakMax(state) {
        return SementrisParamTuner._stateToData(state, [
            5, // 0
            5, // 500
            7, // 1000
            7, // 1500
            8, // 2000
            8, // 2500
            10, // 3000
            10, // 3500
            10, // 4000
            12, // 4500
            15, // 5000
            15, // 5500
            15, // 6000
            15, // 6500
            18, // 7000
            18, // 7500
            20, // 8000
            20, // 8500
            20, // 9000
            20, // 9500
            20, // 10000
        ]);
    }

    static wordLevel(state) {
        return SementrisParamTuner._stateToData(state, [
            [1], // 0
            [2], // 500
            [2], // 1000
            [2, 3], // 1500
            [1, 2, 3], // 2000
            [3, 4], // 2500
            [2, 3, 4], // 3000
            [2, 3, 4], // 3500
            [3, 4, 5], // 4000
            [2, 3, 4, 5], // 4500
            [1, 2, 3, 4, 5], // 5000
        ]);
    }

    static targetNum(state) {
        return SementrisParamTuner._stateToData(state, [
            1, // 0
            1, // 500
            2, // 1000
            2, // 1500
            2, // 2000
            2, // 2500
            3, // 3000
        ]);
    }

    static targetBorder(state) {
        if (10 <= state.stage && state.stage < 20) {
            return 5;
        } else {
            return 4;
        }
    }

    static fillBorder(state) {
        return 10; // TEMP
    }

    static dieBorder(state) {
        return 25; // TEMP
    }

    static fillFrame(state) {
        return 5; // TEMP
    }

    static fallFrame(state) {
        return 120; // TEMP
    }

    static sortFrame(state) {
        return 30; // TEMP
    }

    static destroyFrame(state) {
        return 30; // TEMP
    }

    static streakFrame(state) {
        return 90; // TEMP
    }
}
