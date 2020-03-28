module.exports = {
  serverURL: "http://localhost:3000",
  simulationSpeed: 60,
  world: {
    size: 2000,
    grid: 20,
    maxSpeed: 7,
    acceleration: 2,
  },
  player: {
    size: 20,
  },
  health: {
    reduce: 3,
    itemIncrease: 20,
    reduceHealthy: 1,
    reduceInfected: 1.5,
  },
  infection: {
    thresholdDistance: 150,
    speed: 1,
  },
  item: {
    spawnFrequency: 10,
    size: 10,
  },
};
