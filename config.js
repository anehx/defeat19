module.exports = {
  port: process.env.PORT || 3000,
  url: process.env.SERVER_URL || "http://localhost:3000",
  simulationSpeed: 60,
  world: {
    size: 2000,
    grid: 20,
    maxSpeedWhenHealthy: 7,
    maxSpeedWhenInfected: 8,
    acceleration: 2,
  },
  player: {
    size: 20,
    bar: {
      width: 100,
      height: 10,
    },
  },
  health: {
    itemIncrease: 20,
    reduceWhenHealthy: 1,
    reduceWhenInfected: 1.5,
  },
  infection: {
    thresholdDistance: 150,
    speed: 1,
    reduceWhenHealthy: 5,
    reduceWhenInfected: 1,
  },
  death: {
    // remove dead players after x seconds
    removeAfter: 5,
  },
  item: {
    // spawn an item around every x seconds per player
    spawnDelay: 12,
    size: 10,
  },
};
