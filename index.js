var vu_data_th = [[1], [2]];
var vx_data_th = [[1], [2]];
var vy_data_th = [[1], [2]];
var vu_data = [[1], [2]];
var vx_data = [[1], [2]];
var vy_data = [[1], [2]];
var sum_bvu = [[1], [2]];
var aTemp = [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
];
var bTemp = [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
];
var tr = -0.3;
var h = 0.1;
var rk = 100; // 10000;
var canvas;
var imagePrint = function (count) {
    var arr = new Uint8ClampedArray(4 * vy_data_th.length * vy_data_th[0].length);
    var c = 0;
    for (var i = 0; i < vy_data_th.length; i++) {
        var _loop_1 = function (j) {
            var y = vy_data_th[i][j];
            var y2 = (function () {
                if (y < -1) {
                    return -1;
                }
                if (y > 1) {
                    return 1;
                }
                return y;
            })();
            var y3 = Math.floor(-y2 * 128 + 128);
            arr[c + 0] = y3;
            arr[c + 1] = y3;
            arr[c + 2] = y3;
            arr[c + 3] = 255;
            c += 4;
        };
        for (var j = 0; j < vy_data_th[i].length; j++) {
            _loop_1(j);
        }
    }
    var image = new ImageData(arr, vy_data_th.length);
    postMessage({ image: image, count: count });
};
var init = function () {
    sum_bvu = Array.apply(null, Array(vu_data_th.length)).map(function () {
        return Array.apply(null, Array(vu_data_th[0].length)).map(function () {
            return 0;
        });
    });
    sum_bvu.forEach(function (x, i) {
        x.forEach(function (y, j) {
            for (var i2 = 0; i2 < 3; i2++) {
                for (var j2 = 0; j2 < 3; j2++) {
                    sum_bvu[i][j] = sum_bvu[i][j] + vy_data_th[(sum_bvu.length + i + i2 - 1) % sum_bvu.length][(x.length + j + j2 - 1) % x.length] * bTemp[i2][j2];
                }
            }
        });
    });
};
var copy_data = function (data) {
    return data.map(function (x) {
        return x.slice();
    });
};
var input_image_all = function (data, width, height) {
    vu_data = input_image(data, width, height);
    vx_data = copy_data(vu_data);
    vu_data_th = copy_data(vu_data);
    vy_data_th = copy_data(vu_data);
    vx_data_th = copy_data(vu_data);
    vu_data.forEach(function (x, i) {
        x.forEach(function (y, j) {
            vu_data_th[i][j] = -(vu_data[i][j] - 128) / 128;
            vy_data_th[i][j] = -(vu_data[i][j] - 128) / 128;
            vx_data_th[i][j] = -(vu_data[i][j] - 128) / 128;
        });
    });
};
var input_image = function (data, width, height) {
    var a = (Array.from(data))
        .map(function (v, i) { return (i % 4 === 0) ? v : undefined; }) // 白黒前提
        .filter(function (v) { return v !== undefined; });
    return Array.apply(null, Array(width)).map(function (x, i) {
        return Array.apply(null, Array(height)).map(function (y, j) {
            return a[i * width + j];
        });
    });
};
var cnnMain = function () {
    // k1 準備
    var sum_avy = Array.apply(null, Array(vu_data_th.length)).map(function () {
        return Array.apply(null, Array(vu_data_th[0].length)).map(function () {
            return 0;
        });
    });
    sum_avy.forEach(function (x, i) {
        x.forEach(function (y, j) {
            for (var i2 = 0; i2 < 3; i2++) {
                for (var j2 = 0; j2 < 3; j2++) {
                    sum_avy[i][j] = sum_avy[i][j] + vy_data_th[(sum_avy.length + i + i2 - 1) % sum_avy.length][(x.length + j + j2 - 1) % x.length] * aTemp[i2][j2];
                }
            }
        });
    });
    // k1
    var k1 = sum_avy.map(function (x, i) {
        return x.map(function (y, j) {
            // y = sum_avy[i][j]
            return h * (-vx_data_th[i][j] + y + sum_bvu[i][j] + tr);
        });
    });
    vy_data_th = k1.map(function (x, i) {
        return x.map(function (y, j) {
            // y = k1[i][j]
            return (Math.abs(vx_data_th[i][j] + (y / 2) + 1) - Math.abs(vx_data_th[i][j] + (y / 2) - 1)) / 2;
        });
    });
    // k2 準備
    sum_avy = sum_avy.map(function (x) {
        return x.map(function () {
            return 0;
        });
    });
    sum_avy.forEach(function (x, i) {
        x.forEach(function (y, j) {
            for (var i2 = 0; i2 < 3; i2++) {
                for (var j2 = 0; j2 < 3; j2++) {
                    sum_avy[i][j] = sum_avy[i][j] + vy_data_th[(sum_avy.length + i + i2 - 1) % sum_avy.length][(x.length + j + j2 - 1) % x.length] * aTemp[i2][j2];
                }
            }
        });
    });
    // k2
    var k2 = sum_avy.map(function (x, i) {
        return x.map(function (y, j) {
            // y = sum_avy[i][j]
            return h * (-vx_data_th[i][j] - (k1[i][j] / 2) + y + sum_bvu[i][j] + tr);
        });
    });
    vy_data_th = k2.map(function (x, i) {
        return x.map(function (y, j) {
            // y = k2[i][j]
            return (Math.abs(vx_data_th[i][j] + (y / 2) + 1) - Math.abs(vx_data_th[i][j] + (y / 2) - 1)) / 2;
        });
    });
    // k3 準備
    sum_avy = sum_avy.map(function (x) {
        return x.map(function () {
            return 0;
        });
    });
    sum_avy.forEach(function (x, i) {
        x.forEach(function (y, j) {
            for (var i2 = 0; i2 < 3; i2++) {
                for (var j2 = 0; j2 < 3; j2++) {
                    sum_avy[i][j] = sum_avy[i][j] + vy_data_th[(sum_avy.length + i + i2 - 1) % sum_avy.length][(x.length + j + j2 - 1) % x.length] * aTemp[i2][j2];
                }
            }
        });
    });
    // k3
    var k3 = sum_avy.map(function (x, i) {
        return x.map(function (y, j) {
            // y = sum_avy[i][j]
            return h * (-vx_data_th[i][j] - (k2[i][j] / 2) + y + sum_bvu[i][j] + tr);
        });
    });
    vy_data_th = k3.map(function (x, i) {
        return x.map(function (y, j) {
            // y = k3[i][j]
            return (Math.abs(vx_data_th[i][j] + y + 1) - Math.abs(vx_data_th[i][j] + y - 1)) / 2;
        });
    });
    // k4 準備
    sum_avy = sum_avy.map(function (x) {
        return x.map(function () {
            return 0;
        });
    });
    sum_avy.forEach(function (x, i) {
        x.forEach(function (y, j) {
            for (var i2 = 0; i2 < 3; i2++) {
                for (var j2 = 0; j2 < 3; j2++) {
                    sum_avy[i][j] = sum_avy[i][j] + vy_data_th[(sum_avy.length + i + i2 - 1) % sum_avy.length][(x.length + j + j2 - 1) % x.length] * aTemp[i2][j2];
                }
            }
        });
    });
    // k4
    var k4 = sum_avy.map(function (x, i) {
        return x.map(function (y, j) {
            // y = sum_avy[i][j]
            return h * (-vx_data_th[i][j] - k3[i][j] + y + sum_bvu[i][j] + tr);
        });
    });
    /*
    k1, k2, k3, k4が求まったのでVxDataを以下の式により更新する。
    Vx(t+h) = Vx(t) + (k1 + 2*k2 + 2*k3 + k4)/6;
    */
    vx_data_th = vx_data_th.map(function (x, i) {
        return x.map(function (y, j) {
            // y = vx_data_th[i][j]
            return y + (k1[i][j] + 2 * k2[i][j] + 2 * k3[i][j] + k4[i][j]) / 6;
        });
    });
    // 更新した状態値と出力方程式で出力値も求める。
    vy_data_th = vx_data_th.map(function (x, i) {
        return x.map(function (y, j) {
            // y = vx_data_th[i][j]
            return (Math.abs(y + 1) - Math.abs(y - 1)) / 2;
        });
    });
};
onmessage = function (e) {
    var d = e.data;
    aTemp = d.aTemp;
    bTemp = d.bTemp;
    tr = d.tr,
        h = d.h,
        rk = d.rk,
        input_image_all(d.data, d.width, d.height);
    init();
    for (var count = 0; count < rk; count++) {
        cnnMain();
        imagePrint(count);
    }
};
