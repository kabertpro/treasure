import * as THREE from 'three';

// Cache generated textures to save memory and draw calls
const textureCache = new Map<string, THREE.CanvasTexture>();

function createPixelTexture(
  name: string,
  width: number,
  height: number,
  drawer: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  if (textureCache.has(name)) {
    return textureCache.get(name)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawer(ctx);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(name, texture);
  return texture;
}

export const VoxelTextures = {
  // Vibrant Minecraft-style Grass Top
  getGrassTop(): THREE.CanvasTexture {
    return createPixelTexture('grass_top', 16, 16, (ctx) => {
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, 0, 16, 16);
      const greens = ['#22c55e', '#16a34a', '#86efac', '#15803d'];
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          if (Math.random() > 0.4) {
            ctx.fillStyle = greens[Math.floor(Math.random() * greens.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
  },

  // Grass Side (green overhang + dirt bottom)
  getGrassSide(): THREE.CanvasTexture {
    return createPixelTexture('grass_side', 16, 16, (ctx) => {
      // Dirt base
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, 16, 16);
      const dirts = ['#92400e', '#592206', '#a16207', '#451a03'];
      for (let x = 0; x < 16; x++) {
        for (let y = 4; y < 16; y++) {
          if (Math.random() > 0.35) {
            ctx.fillStyle = dirts[Math.floor(Math.random() * dirts.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      // Grass overhang top
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, 0, 16, 3);
      for (let x = 0; x < 16; x++) {
        const drop = Math.floor(Math.random() * 3);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x, 0, 1, 3 + drop);
      }
    });
  },

  // Dirt
  getDirt(): THREE.CanvasTexture {
    return createPixelTexture('dirt', 16, 16, (ctx) => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, 16, 16);
      const dirts = ['#92400e', '#592206', '#a16207', '#451a03'];
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          if (Math.random() > 0.3) {
            ctx.fillStyle = dirts[Math.floor(Math.random() * dirts.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
  },

  // Sand
  getSand(): THREE.CanvasTexture {
    return createPixelTexture('sand', 16, 16, (ctx) => {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(0, 0, 16, 16);
      const sands = ['#eab308', '#fef08a', '#ca8a04', '#d97706'];
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          if (Math.random() > 0.35) {
            ctx.fillStyle = sands[Math.floor(Math.random() * sands.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
  },

  // Stone / Cobblestone
  getStone(): THREE.CanvasTexture {
    return createPixelTexture('stone', 16, 16, (ctx) => {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, 16, 16);
      const stones = ['#475569', '#334155', '#94a3b8', '#1e293b'];
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          if (Math.random() > 0.35) {
            ctx.fillStyle = stones[Math.floor(Math.random() * stones.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
  },

  // Castle Stone Brick
  getStoneBrick(): THREE.CanvasTexture {
    return createPixelTexture('stone_brick', 16, 16, (ctx) => {
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 16, 16);
      // Mortar lines
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 8, 16, 1);
      ctx.fillRect(8, 0, 1, 8);
      ctx.fillRect(0, 8, 1, 8);
      ctx.fillRect(15, 8, 1, 8);
      // Brick highlights
      ctx.fillStyle = '#64748b';
      ctx.fillRect(1, 1, 6, 2);
      ctx.fillRect(9, 1, 6, 2);
      ctx.fillRect(1, 9, 13, 2);
    });
  },

  // Wood Log Bark
  getLogSide(): THREE.CanvasTexture {
    return createPixelTexture('log_side', 16, 16, (ctx) => {
      ctx.fillStyle = '#592206';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#451a03';
      for (let x = 0; x < 16; x += 3) {
        ctx.fillRect(x, 0, 1, 16);
      }
      ctx.fillStyle = '#78350f';
      for (let x = 1; x < 16; x += 3) {
        ctx.fillRect(x, 0, 1, 16);
      }
    });
  },

  // Leaves
  getLeaves(): THREE.CanvasTexture {
    return createPixelTexture('leaves', 16, 16, (ctx) => {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, 16, 16);
      const greens = ['#16a34a', '#22c55e', '#14532d', '#4ade80'];
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          if (Math.random() > 0.4) {
            ctx.fillStyle = greens[Math.floor(Math.random() * greens.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
  },

  // Asphalt Road
  getRoad(): THREE.CanvasTexture {
    return createPixelTexture('road', 16, 16, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#334155';
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
      }
      // Center yellow dashed road lines
      ctx.fillStyle = '#facc15';
      ctx.fillRect(7, 3, 2, 4);
      ctx.fillRect(7, 11, 2, 4);
    });
  },

  // City Cyber Metal
  getMetalPanel(): THREE.CanvasTexture {
    return createPixelTexture('metal_panel', 16, 16, (ctx) => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 2, 12, 12);
      // Rivets in corners
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(2, 2, 1, 1);
      ctx.fillRect(13, 2, 1, 1);
      ctx.fillRect(2, 13, 1, 1);
      ctx.fillRect(13, 13, 1, 1);
    });
  },

  // Obsidian / Fortress Dark Rock
  getObsidian(): THREE.CanvasTexture {
    return createPixelTexture('obsidian', 16, 16, (ctx) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 16, 16);
      const purples = ['#1e1b4b', '#2e1065', '#3b0764', '#020617'];
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          if (Math.random() > 0.3) {
            ctx.fillStyle = purples[Math.floor(Math.random() * purples.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
  },

  // Lava
  getLava(): THREE.CanvasTexture {
    return createPixelTexture('lava', 16, 16, (ctx) => {
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, 0, 16, 16);
      const lavas = ['#dc2626', '#f97316', '#facc15', '#b91c1c'];
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          if (Math.random() > 0.3) {
            ctx.fillStyle = lavas[Math.floor(Math.random() * lavas.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
  },

  // Water
  getWater(): THREE.CanvasTexture {
    return createPixelTexture('water', 16, 16, (ctx) => {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 16, 16);
      const blues = ['#0369a1', '#38bdf8', '#0ea5e9', '#075985'];
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          if (Math.random() > 0.4) {
            ctx.fillStyle = blues[Math.floor(Math.random() * blues.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
  },

  // Wooden Crate
  getCrate(): THREE.CanvasTexture {
    return createPixelTexture('crate', 16, 16, (ctx) => {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, 0, 16, 16);
      // Border frame
      ctx.fillStyle = '#451a03';
      ctx.strokeRect(0.5, 0.5, 15, 15);
      // Cross support
      ctx.beginPath();
      ctx.moveTo(1, 1);
      ctx.lineTo(15, 15);
      ctx.moveTo(15, 1);
      ctx.lineTo(1, 15);
      ctx.strokeStyle = '#592206';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  },
};
