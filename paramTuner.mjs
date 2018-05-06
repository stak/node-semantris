
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
        return SementrisParamTuner._stateToData(state, [
            10, // 0
            11, // 500
            12, // 1000
            12, // 1500
            12, // 2000
            13, // 2500
            13, // 3000
            13, // 3500
            14, // 4000
            14, // 4500
            15, // 5000
        ]);
    }

    static dieBorder(state) {
        return 26;
    }

    static fillFrame(state) {
        return SementrisParamTuner._stateToData(state, [
            5, // 0
            5, // 500
            5, // 1000
            5, // 1500
            5, // 2000
            4, // 2500
            4, // 3000
            4, // 3500
            4, // 4000
            4, // 4500
            3, // 5000
        ]);
    }

    static fallFrame(state) {
        return SementrisParamTuner._stateToData(state, [
            999999, // 0
            120, // 500
            60, // 1000
            60, // 1500
            55, // 2000
            55, // 2500
            50, // 3000
            50, // 3500
            45, // 4000
            45, // 4500
            40, // 5000
            40, // 5500
            35, // 6000
            35, // 6500
            30, // 7000
            30, // 7500
            25, // 8000
            25, // 8500
            20, // 9000
            15, // 9500
            15, // 10000
        ]);
    }

    static sortFrame(state) {
        return SementrisParamTuner._stateToData(state, [
            60, // 0
            60, // 500
            50, // 1000
            50, // 1500
            50, // 2000
            45, // 2500
            45, // 3000
            45, // 3500
            40, // 4000
            40, // 4500
            40, // 5000
            35, // 5500
            35, // 6000
            35, // 6500
            30, // 7000
            30, // 7500
            30, // 8000
            25, // 8500
            25, // 9000
            25, // 9500
            25, // 10000
        ]);
    }

    static destroyFrame(state) {
        return SementrisParamTuner._stateToData(state, [
            30, // 0
            30, // 500
            30, // 1000
            28, // 1500
            28, // 2000
            28, // 2500
            26, // 3000
            26, // 3500
            26, // 4000
            24, // 4500
            24, // 5000
            24, // 5500
            22, // 6000
            22, // 6500
            22, // 7000
            20, // 7500
            20, // 8000
            20, // 8500
            18, // 9000
            18, // 9500
            16, // 10000
        ]);
    }

    static streakFrame(state) {
        return SementrisParamTuner._stateToData(state, [
            120, // 0
            110, // 500
            110, // 1000
            110, // 1500
            100, // 2000
            100, // 2500
            100, // 3000
            90, // 3500
            90, // 4000
            90, // 4500
            80, // 5000
            80, // 5500
            80, // 6000
            70, // 6500
            70, // 7000
            70, // 7500
            60, // 8000
            60, // 8500
            60, // 9000
            50, // 9500
            50, // 10000
        ]);
    }
}
