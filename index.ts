
let vu_data_th: number[][] = [[1],[2]];
let vx_data_th: number[][] = [[1],[2]];
let vy_data_th: number[][] = [[1],[2]];
let vu_data: number[][] = [[1],[2]];
let vx_data: number[][] = [[1],[2]];
let vy_data: number[][] = [[1],[2]];
let sum_bvu: number[][] = [[1],[2]];
const aTemp = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
];
const bTemp = [
  [-1, -1, -1],
  [-1,  8, -1],
  [-1, -1, -1],
];
const tr = -0.3;

const h = 0.1;
const rk = 100; // 10000;

let canvas: HTMLCanvasElement;

const imagePrint = (count: number) => {
  const arr = new Uint8ClampedArray(4 * vy_data_th.length * vy_data_th[0].length);
  let c = 0;
  for (let i = 0; i < vy_data_th.length; i++) {
    for (let j = 0; j < vy_data_th[i].length; j++) {
      const y = vy_data_th[i][j];
      const y2 = (() => {
        if (y < -1) {
          return -1;
        }
        if (y > 1) {
          return 1;
        }
        return y;
      })();
      const y3 = Math.floor(- y2 * 128 + 128);
      arr[c + 0] = y3;
      arr[c + 1] = y3;
      arr[c + 2] = y3;
      arr[c + 3] = 255;
      c += 4;
    }
  }
  const image = new ImageData(arr, vy_data_th.length);
  postMessage({image, count});
};

const init = () => {
  sum_bvu = Array.apply(null, Array(vu_data_th.length)).map(() => {
    return Array.apply(null, Array(vu_data_th[0].length)).map(() => {
      return 0;
    })
  });
  sum_bvu.forEach((x, i) => {
    x.forEach((y, j) => {
      for (let i2 = 0; i2 < 3; i2++) {
        for (let j2 = 0; j2 < 3; j2++) {
          sum_bvu[i][j] = sum_bvu[i][j] + vy_data_th[(sum_bvu.length+i+i2-1)%sum_bvu.length][(x.length+j+j2-1)%x.length]*bTemp[i2][j2];
        }
      }
    })
  });
}

const copy_data = (data: number[][]): number[][] => {
  return data.map((x) => {
    return x.slice();
  })
}

const input_image_all = (data: Uint8ClampedArray, width: number, height: number) => {
  vu_data = input_image(data, width, height);
  vx_data = copy_data(vu_data);
  vu_data_th = copy_data(vu_data);
  vy_data_th = copy_data(vu_data);
  vx_data_th = copy_data(vu_data);
  vu_data.forEach((x, i) => {
    x.forEach((y, j) => {
      vu_data_th[i][j] = -(vu_data[i][j]-128)/128;
      vy_data_th[i][j] = -(vu_data[i][j]-128)/128;
      vx_data_th[i][j] = -(vu_data[i][j]-128)/128;
    })
  });
};

const input_image = (data: Uint8ClampedArray, width: number, height: number) => {
  const a = (Array.from(data))
    .map((v, i) => (i % 4 === 0) ? v : undefined) // 白黒前提
    .filter((v) => v !== undefined);

  return Array.apply(null, Array(width)).map((x, i) => {
    return Array.apply(null, Array(height)).map((y, j) => {
      return a[i * width + j];
    })
  });

}

const cnnMain = () => {
  // k1 準備
  let sum_avy: number[][] = Array.apply(null, Array(vu_data_th.length)).map(() => {
    return Array.apply(null, Array(vu_data_th[0].length)).map(() => {
      return 0;
    })
  });
  sum_avy.forEach((x, i) => {
    x.forEach((y, j) => {
      for (let i2 = 0; i2 < 3; i2++) {
        for (let j2 = 0; j2 < 3; j2++) {
          sum_avy[i][j] = sum_avy[i][j] + vy_data_th[(sum_avy.length+i+i2-1)%sum_avy.length][(x.length+j+j2-1)%x.length]*aTemp[i2][j2];
        }
      }
    })
  });
  // k1
  const k1 = sum_avy.map((x, i) => {
    return x.map((y, j) => {
      // y = sum_avy[i][j]
      return h * ( -vx_data_th[i][j] + y  + sum_bvu[i][j] + tr);
    })
  });
  vy_data_th = k1.map((x, i) => {
    return x.map((y, j) => {
      // y = k1[i][j]
      return (Math.abs(vx_data_th[i][j]+(y/2)+1) - Math.abs(vx_data_th[i][j] + (y/2) - 1)) / 2;
    })
  });

  // k2 準備
  sum_avy = sum_avy.map((x) => {
    return x.map(() => {
      return 0;
    })
  });
  sum_avy.forEach((x, i) => {
    x.forEach((y, j) => {
      for (let i2 = 0; i2 < 3; i2++) {
        for (let j2 = 0; j2 < 3; j2++) {
          sum_avy[i][j] = sum_avy[i][j] + vy_data_th[(sum_avy.length+i+i2-1)%sum_avy.length][(x.length+j+j2-1)%x.length]*aTemp[i2][j2];
        }
      }
    })
  });
  // k2
  const k2 = sum_avy.map((x, i) => {
    return x.map((y, j) => {
      // y = sum_avy[i][j]
      return h * ( -vx_data_th[i][j]-(k1[i][j]/2) + y + sum_bvu[i][j] + tr);
    })
  });
  vy_data_th = k2.map((x, i) => {
    return x.map((y, j) => {
      // y = k2[i][j]
      return (Math.abs(vx_data_th[i][j]+(y/2)+1)-Math.abs(vx_data_th[i][j]+(y/2)-1))/2;
    })
  });

  // k3 準備
  sum_avy = sum_avy.map((x) => {
    return x.map(() => {
      return 0;
    })
  });
  sum_avy.forEach((x, i) => {
    x.forEach((y, j) => {
      for (let i2 = 0; i2 < 3; i2++) {
        for (let j2 = 0; j2 < 3; j2++) {
          sum_avy[i][j] = sum_avy[i][j] + vy_data_th[(sum_avy.length+i+i2-1)%sum_avy.length][(x.length+j+j2-1)%x.length]*aTemp[i2][j2];
        }
      }
    })
  });
  // k3
  const k3 = sum_avy.map((x, i) => {
    return x.map((y, j) => {
      // y = sum_avy[i][j]
      return h * ( -vx_data_th[i][j]-(k2[i][j]/2) + y + sum_bvu[i][j] + tr);
    })
  });
  vy_data_th = k3.map((x, i) => {
    return x.map((y, j) => {
      // y = k3[i][j]
      return (Math.abs(vx_data_th[i][j] + y+1)-Math.abs(vx_data_th[i][j]+y-1))/2;
    })
  });

  // k4 準備
  sum_avy = sum_avy.map((x) => {
    return x.map(() => {
      return 0;
    })
  });
  sum_avy.forEach((x, i) => {
    x.forEach((y, j) => {
      for (let i2 = 0; i2 < 3; i2++) {
        for (let j2 = 0; j2 < 3; j2++) {
          sum_avy[i][j] = sum_avy[i][j] + vy_data_th[(sum_avy.length+i+i2-1)%sum_avy.length][(x.length+j+j2-1)%x.length]*aTemp[i2][j2];
        }
      }
    })
  });
  // k4
  const k4 = sum_avy.map((x, i) => {
    return x.map((y, j) => {
      // y = sum_avy[i][j]
      return h * ( -vx_data_th[i][j]-k3[i][j] + y + sum_bvu[i][j] + tr);
    })
  });

  /*
  k1, k2, k3, k4が求まったのでVxDataを以下の式により更新する。
  Vx(t+h) = Vx(t) + (k1 + 2*k2 + 2*k3 + k4)/6;
  */
  vx_data_th = vx_data_th.map((x, i) => {
    return x.map((y, j) => {
      // y = vx_data_th[i][j]
      return y + (k1[i][j] + 2*k2[i][j] + 2*k3[i][j] + k4[i][j])/6;
    }) 
  });
  // 更新した状態値と出力方程式で出力値も求める。
  vy_data_th = vx_data_th.map((x, i) => {
    return x.map((y, j) => {
      // y = vx_data_th[i][j]
      return (Math.abs(y+1)-Math.abs(y-1))/2;
    })
  });
};

onmessage = (e) => {
  const d = e.data;
  aTemp = d.aTemp;
  bTemp = d.bTemp;
  tr = d.tr,
  h = d.h,
  rk = d.rk,
  input_image_all(d.data, d.width, d.height);
  init();
  for (let count = 0; count < rk; count++) {
    cnnMain();
    imagePrint(count);
  }
};
